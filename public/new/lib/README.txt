Vendored so the room never waits on a third-party CDN. three@0.160.0 (MIT, three/LICENSE) and gsap@3.12.5 (GreenSock standard licence, gsap/LICENSE.txt), from their npm packages.
three.module.min.js, meshopt_decoder.module.js and gsap.min.js are copied unchanged; the other addons are minified once with: npx -y esbuild@0.24.0 <file> --minify --legal-comments=inline --format=esm
To upgrade, replace every file here and bump the versions above.
