#!/bin/bash
# A robust wrapper script to check for Stripe login before listening.

# 1. Use a quick, non-blocking command to check the login status.
# We redirect stdout to /dev/null and check only stderr.
echo "Checking Stripe authentication status..."
if ! stripe customers list --limit 1 > /dev/null 2>&1; then
  echo "------------------------------------------"
  echo "Stripe authentication required."
  echo "Please log in via the browser window that opens."
  echo "------------------------------------------"

  # 2. If the check fails, run the login command.
  stripe login

  # Check the exit code of the login command.
  if [ $? -ne 0 ]; then
    echo "Login failed. Please try running 'stripe login' manually."
    exit 1
  fi
  echo "Login successful!"
fi

# 3. If we're here, the user is logged in. Run the actual listen command.
# This command is NOT wrapped in $() so it can run persistently.
echo "Starting Stripe webhook listener..."
stripe listen --forward-to localhost:3000/api/stripe/webhook
