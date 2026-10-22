# Svelte library

## Android APK preview (Capacitor)

The Android build bundles the Svelte UI into the APK. SvelteKit's API and MongoDB
remain on a server; they are not bundled into the app.

1. Install Android Studio, including its Android SDK and JDK.
2. Copy `.env.capacitor.example` to `.env.capacitor`. Set `VITE_API_BASE_URL` to
   the HTTPS URL of the deployed SvelteKit server if you want login to work.
   This URL is public and will be included in the APK; do not put secrets here.
3. Build the bundled UI and sync it to Android:

   ```sh
   bun run build:android
   ```

4. Open the Android project:

   ```sh
   bun run android:open
   ```

5. In Android Studio, select a device or emulator and press **Run**. Android
   Studio can also generate a debug APK from **Build > Build Bundle(s) / APK(s)
   > Build APK(s)**.

The APK can display the bundled UI without an API deployment, but login needs
the server URL above and the API must allow requests from the Capacitor app.
Regular `bun run build` continues to use the server adapter; only
`bun run build:capacitor` creates the static Capacitor build.

Everything you need to build a Svelte library, powered by [`sv`](https://npmjs.com/package/sv).

Read more about creating a library [in the docs](https://svelte.dev/docs/kit/packaging).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@1.1.1 create --template library --types ts --install bun budget-tracker-pwa
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

## Building

To build your library:

```sh
npm pack
```

To create a production version of your showcase app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Publishing

Go into the `package.json` and give your package the desired name through the `"name"` option. Also consider adding a `"license"` field and point it to a `LICENSE` file which you can create from a template (one popular option is the [MIT license](https://opensource.org/license/mit/)).

To publish your library to [npm](https://www.npmjs.com):

```sh
npm publish
```
