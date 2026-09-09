# ClearBG

Jednostavan background remover koji radi direktno u browseru.

## Šta radi

- drag & drop ili odabir slike
- AI uklanjanje pozadine
- transparentni PNG rezultat
- download bez servera
- slike se ne uploaduju na naš backend
- spremno za GitHub Pages

## Pokretanje lokalno

```bash
npm install
npm run dev
```

Zatim otvori adresu koju Vite ispiše u terminalu.

## GitHub Pages

1. Napravi novi GitHub repository, npr. `clearbg`.
2. Ubaci sve fajlove iz ovog projekta.
3. Pushaj na `main` branch.
4. Otvori **Settings → Pages**.
5. Pod **Build and deployment → Source** izaberi **GitHub Actions**.
6. Nakon workflowa stranica će biti dostupna na `https://USERNAME.github.io/clearbg/`.

## Važna napomena o AI modelu

`@imgly/background-removal` po defaultu povlači ONNX/WASM assets sa IMG.LY hostinga pri prvom korištenju, a browser ih zatim cacheira.

Za potpunu nezavisnost možemo u sljedećem koraku self-hostati i model/WASM fajlove te postaviti `publicPath` na vlastiti hosting.

## Licenca dependencyja

`@imgly/background-removal` je objavljen pod AGPL licencom. Ako projekat bude javno dostupan, provjeri i poštuj uslove njihove licence.
