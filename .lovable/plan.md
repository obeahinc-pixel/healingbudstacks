

# Update Shipping Addresses for Existing Clients

## Problem
Three existing client accounts are missing their shipping addresses in the local database. The user has provided the addresses directly.

## Data to Insert

| Account | Email | Client ID | Address |
|---|---|---|---|
| Scott | scott.k1@outlook.com | dfd81e64-... (from DB) | 123 Sandton Drive, Sandton, Sandton, 2196, ZAF |
| Kay | kayliegh.sm@gmail.com | 47542db8-... (from DB) | 1937 Prospect Street, Pretoria, Gauteng, 0036, ZAF |
| Admin Scott | scott@healingbuds.global | fb70d208-8f12-4444-9b1b-e92bd68f675f | 123 Sandton Drive, Sandton, Sandton, 2196, ZAF |

## Changes

### 1. Update `drgreen_clients` table directly

Run three UPDATE statements to set `shipping_address` (JSONB) and `country_code` for each client:

- **Scott (scott.k1)**: `shipping_address` = `{"address1":"123 Sandton Drive","city":"Sandton","state":"Sandton","postalCode":"2196","country":"South Africa","countryCode":"ZAF"}`, `country_code` = `ZA`
- **Kay**: `shipping_address` = `{"address1":"1937 Prospect Street","city":"Pretoria","state":"Gauteng","postalCode":"0036","country":"South Africa","countryCode":"ZAF"}`, `country_code` = `ZA`
- **Admin Scott**: `shipping_address` = `{"address1":"123 Sandton Drive","city":"Sandton","state":"Sandton","postalCode":"2196","country":"South Africa","countryCode":"ZAF"}`, `country_code` = `ZA`

### 2. No code changes required

The `ShippingAddressForm` and checkout flow already read from `drgreen_clients.shipping_address`. Once populated, these addresses will appear automatically during checkout.

## Files Modified

None -- this is a data-only update using SQL INSERT/UPDATE statements against the `drgreen_clients` table.

