<?php

// Chargily configuration.
// Set these as server environment variables for real/test deployments.
// Never commit real API keys or secrets to GitHub.

$chargilyMode = getenv("CHARGILY_MODE") ?: "test";

define("CHARGILY_API_KEY", getenv("CHARGILY_API_KEY") ?: "");
define("CHARGILY_API_SECRET", getenv("CHARGILY_API_SECRET") ?: "");
define("CHARGILY_API_URL", "https://pay.chargily.net/{$chargilyMode}/api/v2");
define("SITE_URL", rtrim(getenv("SITE_URL") ?: "http://localhost/pomodoro", "/"));
?>
