<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\DiscountService;
use App\Services\Commerce\OrderFulfillment;
use App\Services\Commerce\StockService;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\SimulatedGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function __construct(
        private CheckoutService $checkout,
        private OrderFulfillment $fulfillment,
        private PaymentGateway $gateway,
        private StockService $stock,
    ) {}

    /** Reserve the cart's keys and open a payment. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['nullable', 'string', 'max:40']]);
        [$order, $intent] = $this->checkout->start($request->user(), $data['code'] ?? null);

        return response()->json([
            'order' => new OrderResource($order->load('items.product.region', 'items.seller')),
            'payment' => [
                'driver' => $this->gateway->driver(),
                'client_secret' => $intent->clientSecret,
            ],
        ], 201);
    }

    /**
     * Called by the browser after the payment form finishes. We never trust the browser's
     * word for it: the order is fulfilled only if the provider reports the payment succeeded.
     */
    public function confirm(Request $request, Order $order): JsonResponse
    {
        $this->authorizeOrder($request, $order);

        if ($this->gateway instanceof SimulatedGateway && $order->status === Order::PENDING) {
            $data = $request->validate(['simulate' => ['required', 'in:success,decline']]);
            $this->gateway->simulate($order, $data['simulate']);
        }

        if ($order->status !== Order::PAID) {
            $status = $this->gateway->status($order);

            if ($status === PaymentGateway::SUCCEEDED) {
                $order = $this->fulfillment->fulfill($order);
            } elseif ($status === PaymentGateway::PROCESSING) {
                return response()->json(['order' => new OrderResource($order->load('items.keys', 'items.product.region', 'items.seller')), 'payment_status' => $status], 202);
            } else {
                return response()->json([
                    'message' => $status === PaymentGateway::CANCELED
                        ? 'This payment was cancelled. Please start checkout again.'
                        : 'Your payment was declined. Please try another card.',
                    'payment_status' => $status,
                ], 402);
            }
        }

        return response()->json([
            'order' => new OrderResource($order->load('items.keys', 'items.product.region', 'items.seller')),
            'payment_status' => PaymentGateway::SUCCEEDED,
        ]);
    }

    /** Pay a pending order from the Eneba Wallet (the cashback balance). */
    public function payWithWallet(Request $request, Order $order): JsonResponse
    {
        $this->authorizeOrder($request, $order);
        abort_unless($order->status === Order::PENDING, 422, 'This order can no longer be paid.');

        $cardPayment = clone $order;
        DB::transaction(function () use ($order) {
            $user = User::whereKey($order->user_id)->lockForUpdate()->first();
            if ($user->cashback_balance_cents < $order->total_cents) {
                throw ValidationException::withMessages(['wallet' => 'Your Eneba Wallet balance is too low for this order.']);
            }
            $user->decrement('cashback_balance_cents', $order->total_cents);
            $order->update(['payment_provider' => 'wallet', 'payment_reference' => 'wallet-'.$order->number, 'wallet_cents' => $order->total_cents]);
        });

        // The card payment opened at checkout is no longer needed.
        if ($cardPayment->payment_reference) {
            try {
                $this->gateway->cancel($cardPayment);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $order = $this->fulfillment->fulfill($order->fresh());

        return response()->json([
            'order' => new OrderResource($order->load('items.keys', 'items.product.region', 'items.seller')),
            'payment_status' => $order->status === Order::PAID ? PaymentGateway::SUCCEEDED : $order->status,
        ]);
    }

    /**
     * Put the Eneba Wallet balance towards an order it can't fully cover; the card pays the rest.
     * The balance is only taken once the card payment succeeds (see OrderFulfillment), so an
     * abandoned checkout never holds wallet money.
     */
    public function useWallet(Request $request, Order $order): JsonResponse
    {
        $this->authorizeOrder($request, $order);
        $data = $request->validate(['use' => ['required', 'boolean']]);
        abort_unless($order->status === Order::PENDING, 422, 'This order can no longer be paid.');

        // Once the card has been charged, the split can't change any more.
        if ($this->gateway->status($order) !== PaymentGateway::REQUIRES_PAYMENT_METHOD) {
            throw ValidationException::withMessages(['wallet' => 'This payment is already being processed.']);
        }

        $walletCents = 0;
        if ($data['use']) {
            $balance = $request->user()->fresh()->cashback_balance_cents;
            // The card must still charge Stripe's minimum.
            $walletCents = min($balance, $order->total_cents - DiscountService::MIN_CHARGE_CENTS);
            if ($walletCents <= 0) {
                throw ValidationException::withMessages(['wallet' => 'Your Eneba Wallet balance is empty.']);
            }
        }

        $this->gateway->updateAmount($order, $order->total_cents - $walletCents);
        $order->update(['wallet_cents' => $walletCents]);

        return response()->json(['order' => new OrderResource($order->load('items.product.region', 'items.seller'))]);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        $this->authorizeOrder($request, $order);
        $this->stock->close($order, Order::CANCELLED);

        return response()->json(['order' => new OrderResource($order->fresh()->load('items.product.region', 'items.seller'))]);
    }

    private function authorizeOrder(Request $request, Order $order): void
    {
        abort_unless($order->user_id === $request->user()->id, 404);
    }
}
