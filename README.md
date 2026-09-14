# Taxes

App to form taxes report from IBKR statements

Key idea is that instead of dealing with flex reports we will parse actions statements html report which it self is used as proving document

## TODO

- dividends: confirm the law (likely 18% + 5% on gross for foreign dividends, not 9% on net); if confirmed, remove withholding tax from report, instructions and calculations
- support EUR (and other currencies) — currently everything assumes USD
- update shadcn components — shadcn moved from radix-ui to base-ui (components already import base-ui, radix-ui dependency removed; re-add them with current CLI)
