#!/bin/sh
set -e

# Render tells the container which port to listen on.
PORT="${PORT:-10000}"
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

php artisan config:cache
php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache

# Open the port straight away: Render only waits a few minutes for it, and the first-boot demo
# seed over the network can take longer than that. Migrations (every deploy) and the one-time
# seed run alongside the web server; the seed is all-or-nothing, so a restart can't leave half a
# catalog behind. Ownership is fixed again afterwards for anything artisan wrote as root.
(
  php artisan app:bootstrap || echo "app:bootstrap failed - see the log above" >&2
  chown -R www-data:www-data storage bootstrap/cache
) &

exec "$@"
