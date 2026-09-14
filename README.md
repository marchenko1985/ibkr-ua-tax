# Taxes

App to form taxes report from IBKR statements

Key idea is that instead of dealing with flex reports we will parse actions statements html report which it self is used as proving document

## TODO

- read table columns by header name instead of index — column count depends on statement settings, a shift silently breaks all numbers (real YTD report without "Realized P/L Only": taxes 0 instead of ~457k UAH)
- validate statement settings and fail loudly with instructions how to fix the report (missing "Realized P/L Only", "Display Closing Trades Only", "Hide Details", required sections)
- dividends: confirm the law (likely 18% + 5% on gross for foreign dividends, not 9% on net); if confirmed, remove withholding tax from report, instructions and calculations
- support EUR (and other currencies) — currently everything assumes USD
- more anonymized fixtures in `files/` from short-period real reports: correct settings, wrong columns (no "Realized P/L Only"), not closing trades only, etc.
- update shadcn components — shadcn moved from radix-ui to base-ui (components already import base-ui, radix-ui dependency removed; re-add them with current CLI)
