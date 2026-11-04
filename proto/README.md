# lightwalletd protocol files

`service.proto` and `compact_formats.proto` are copied unchanged from
[zcash/librustzcash](https://github.com/zcash/librustzcash/tree/main/zcash_client_backend/proto)
at commit `3d3821ad0478`, the last commit that changed them (8 Aug 2025).
librustzcash is licensed MIT OR Apache-2.0.

zcash-now loads them at run time with `@grpc/proto-loader` and calls three
read-only methods: `GetLightdInfo`, `GetLatestBlock` and `GetTransaction`.
