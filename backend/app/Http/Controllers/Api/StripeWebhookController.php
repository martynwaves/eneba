<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Commerce\OrderFulfillment;
use App\Services\Commerce\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

/**
 * Server-to-server confirmation from Stripe. Covers buyers who close the tab right after
 * paying: their keys are still delivered and show up in order history.
 */
class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, OrderFulfillment $fulfillment, StockService $stock): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');
        abort_unless($secret, 404);

        try {
            $event = Webhook::constructEvent($request->getContent(), (string) $request->header('Stripe-Signature'), $secret);
        } catch (SignatureVerificationException|\UnexpectedValueException) {
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $intent = $event->data->object;
        $order = Order::where('payment_reference', $intent->id ?? null)->first();
        if (! $order) {
            return response()->json(['received' => true]);
        }

        match ($event->type) {
            'payment_intent.succeeded' => $fulfillment->fulfill($order),
            'payment_intent.canceled' => $stock->close($order, Order::CANCELLED),
            default => null,
        };

        return response()->json(['received' => true]);
    }
}
