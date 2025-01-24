import { knownBrands } from "./app/knownBrands.mjs";
import { localizedRewriteSegments } from "./localizedPaths.mjs";
import {
  supportedCountries,
  supportedLocales,
} from "./supportedLocales.next.config.mjs";

// const externalUrl = `vercel-next-catch-all.vercel.app`
const externalUrl = `dundle.dev`;
const countries = supportedCountries.map((x) => x);
const locales = supportedLocales.map((locale) => locale);

const nextCountrySegment = `:country(${countries.join("|")})`;
const nextLocaleSegment = `:locale(${locales.join("|")})`;

// const countrySegment = `:country((?:[a-zA-Z]{2}))`;
// const localeSegment = `:locale((?:[a-zA-Z]{2}))`;
const categorySegment = `:category(${localizedRewriteSegments.category.join(
  "|",
)})`;
const legalSegment = `:legal(${localizedRewriteSegments.legal.join("|")})`;
const eventSegment = `:event(${localizedRewriteSegments.events.join("|")})`;
const brandSegment = `:brand(${knownBrands.join("|")})`;
const cartSegment = `:path(${localizedRewriteSegments.cart.join("|")})`;
const checkoutSegment = `:path(${localizedRewriteSegments.checkout.join("|")})`;

const makeDynamic = (rule) => {
  const destinationSegments = rule.destination
    .split("/")
    .filter(Boolean)
    .join("/");

  return [
    {
      ...rule,
      has: [
        {
          type: "query",
          key: "currency",
        },
      ],
      destination: `/${destinationSegments}/${"dynamic"}`,
    },
    {
      ...rule,
      has: [
        {
          type: "query",
          key: "c",
        },
      ],
      destination: `/${destinationSegments}/${"dynamic"}`,
    },
    { ...rule },
  ];
};

const makeLocaleDynamic = (rule) => {
  const sourceSegments = rule.source.split("/").filter(Boolean).join("/");
  const destinationSegments = rule.destination
    .split("/")
    .filter(Boolean)
    .join("/");

  return [
    {
      source: `/${nextCountrySegment}/${nextLocaleSegment}/${sourceSegments}`,
      destination: `/:country/:locale/${destinationSegments}`,
    },
    {
      source: `/${nextCountrySegment}/${sourceSegments}`,
      destination: `/:country/${"default"}/${destinationSegments}`,
    },
    {
      source: `/${sourceSegments}`,
      destination: `/us/${"default"}/${destinationSegments}`,
    },
  ];
};

const makeCommerceLayerHybridNavigation = (rule) => {
  const sourceSegments = rule.source.split("/").filter(Boolean).join("/");
  const destinationSegments = rule.destination
    .split("/")
    .filter(Boolean)
    .join("/");

  const pathKey = "path";

  const commerceLayerCountries = ["nl"].map((x) => x.toLowerCase());
  const countriesWithoutCommerceLayer = countries.filter(
    (country) => !commerceLayerCountries.includes(country),
  );

  const nuxtCartCountries = `:country(${countriesWithoutCommerceLayer.join(
    "|",
  )})`;
  const nextCartCountries = `:country(${commerceLayerCountries.join("|")})`;

  return [
    // Give next precedence because the list is shorter
    {
      source: `/${nextCartCountries}/${nextLocaleSegment}/${sourceSegments}/`,
      destination: `/:country/:locale/${destinationSegments}/`,
    },
    {
      source: `/${nextCartCountries}/${sourceSegments}`,
      destination: `/:country/${"default"}/${destinationSegments}/`,
    },
    {
      source: `/${nuxtCartCountries}/${nextLocaleSegment}/${sourceSegments}`,
      destination: `https://${externalUrl}/:country/:locale/:${pathKey}/`,
    },
    {
      source: `/${nuxtCartCountries}/${sourceSegments}`,
      destination: `https://${externalUrl}/:country/:${pathKey}/`,
    },
    // the default is a fallback to the nuxt cart
    {
      source: `/${sourceSegments}`,
      destination: `https://${externalUrl}/:${pathKey}/`,
    },
  ];
};

const makeLocaleDynamicWithRules = (rule) => {
  const localeRules = makeLocaleDynamic(rule);
  return localeRules.flatMap((rule) => makeDynamic(rule));
};

/** @type {import('next').NextConfig}  */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  experimental: {
    optimizePackageImports: ["ua-parser-js"],
    serverActions: {
      allowedOrigins: [externalUrl],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // webpack: (
  //   config,
  //   { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack },
  // ) => {
  //   if (dev) {
  //     config.plugins.push(
  //       new WebpackHookPlugin({
  //         onBuildStart: ["npx @spotlightjs/spotlight"],
  //       }),
  //     );
  //   }

  //   return config;
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["ui"],
  headers: async () => {
    return [];
  },
  async rewrites() {
    const eventSlugsRes = ["black-friday"];
    const eventSlugs = eventSlugsRes?.join("|") || "black-friday";

    const legalPages = [
      "privacy-policy",
      "return-policy",
      "terms-and-conditions",
    ];
    const legalSlugs = legalPages?.join("|");

    return {
      beforeFiles: [
        {
          source: "/_nuxt/:path*",
          destination: `https://${externalUrl}/_nuxt/:path*`,
        },
        {
          source: "/magazine/_nuxt/:path*",
          destination: `https://${externalUrl}/magazine/_nuxt/:path*`,
        },
        {
          source: "/manifest.webmanifest",
          destination: `https://${externalUrl}/manifest.webmanifest`,
        },
        {
          source: `/magazine/:path*`,
          destination: `https://${externalUrl}/magazine/:path*/`,
        },
      ],
      // Rewrite rules most specific first
      afterFiles: [
        ...makeCommerceLayerHybridNavigation({
          source: `/${cartSegment}`,
          destination: "/cart/",
        }),
        ...makeCommerceLayerHybridNavigation({
          source: `/${checkoutSegment}`,
          destination: "/payment/",
        }),
        // eventsRewrites,
        ...makeLocaleDynamic({
          source: `/${eventSegment}/:path(${eventSlugs})`,
          destination: "/category/event/event/:path*/",
        }),
        // categoryAndSubCategoryRewrites,
        ...makeLocaleDynamic({
          source: `/${categorySegment}/:path*`,
          destination: "/category/:path*/",
        }),
        // legal pages
        ...makeLocaleDynamic({
          source: `/${legalSegment}/:path(${legalSlugs})`,
          destination: "/legal/:path/",
        }),
        // brand page
        ...makeLocaleDynamicWithRules({
          source: `/${brandSegment}`,
          destination: `/brand/:brand/`,
        }),
        // account page
        ...makeLocaleDynamicWithRules({
          source: `/account/:path*`,
          destination: `/account/:path*/`,
        }),
        // homepage
        ...makeLocaleDynamicWithRules({
          source: `/`,
          destination: `/`,
        }),
        ...makeLocaleDynamic({
          source:
            "/:legal(legal|lainmukainen)/:slug(privacybeleid|privacy|privacy-policy|tietosuojailmoitus|informativa-sulla-privacy|privacidade)",
          destination: "/legal/privacy-policy",
        }),
        ...makeLocaleDynamic({
          source:
            "/:legal(legal)/:slug(returnpolicy|returnpolicy_fr|return-policy|devolucao)",
          destination: "/legal/return-policy",
        }),
        ...makeLocaleDynamic({
          source:
            "/:legal(legal)/:slug(algemenevoorwaarden|terms-and-conditions|condiciones-generales|termos-e-condicoes)",
          destination: "/legal/terms-and-conditions",
        }),
        {
          source: "/:path*",
          destination: `https://${externalUrl}/:path*/`,
          missing: [
            {
              type: "query",
              key: "_rsc",
            },
          ],
        },
      ],
      fallback: [
        {
          source: "/:path*",
          destination: `https://${externalUrl}/:path*/`,
        },
      ],
    };
  },

  async redirects() {
    return [];
  },
};

export default nextConfig;
