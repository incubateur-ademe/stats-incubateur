import "./globals.scss";
import "react-loading-skeleton/dist/skeleton.css";
import { fr } from "@codegouvfr/react-dsfr";
import Display from "@codegouvfr/react-dsfr/Display/Display";
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui";
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { type Metadata } from "next";
import { type PropsWithChildren } from "react";
import { SkeletonTheme } from "react-loading-skeleton";

import { ClientAnimate } from "@/components/utils/ClientAnimate";
import { config } from "@/config";
import { DsfrProvider } from "@/dsfr-bootstrap";
import { DsfrHead, getHtmlAttributes } from "@/dsfr-bootstrap/server-only-index";

import { getOrderedStartups } from "./_stats/utils";
import { DefaultFooter } from "./DefaultFooter";
import { DefaultHeader } from "./DefaultHeader";
import { QueryProvider } from "./QueryProvider";
import styles from "./root.module.scss";
import { sharedMetadata } from "./shared-metadata";
import { SystemMessageDisplay } from "./SystemMessageDisplay";

const contentId = "content";
const footerId = "footer";

export const metadata: Metadata = {
  metadataBase: new URL(config.host),
  ...sharedMetadata,
  openGraph: {
    title: {
      default: config.brand.name,
      template: `${config.brand.name} - %s`,
    },
    ...sharedMetadata.openGraph,
  },
  title: {
    default: config.brand.name,
    template: `${config.brand.name} - %s`,
  },
};

const lang = "fr";

const RootLayout = async ({ children }: PropsWithChildren) => {
  const orderedStartups = await getOrderedStartups();

  return (
    <html lang={lang} {...getHtmlAttributes({ lang })} className={cx(styles.app, "snap-y")}>
      <head>
        <DsfrHead preloadFonts={["Marianne-Regular", "Marianne-Medium", "Marianne-Bold"]} />
      </head>
      <body>
        <QueryProvider>
          <AppRouterCacheProvider>
            <DsfrProvider lang={lang}>
              <MuiDsfrThemeProvider>
                <SkeletonTheme
                  baseColor={fr.colors.decisions.background.contrast.grey.default}
                  highlightColor={fr.colors.decisions.background.contrast.grey.active}
                  borderRadius={fr.spacing("1v")}
                  duration={2}
                >
                  <Display />
                  <SkipLinks
                    links={[
                      {
                        anchor: `#${contentId}`,
                        label: "Contenu",
                      },
                      {
                        anchor: `#${footerId}`,
                        label: "Pied de page",
                      },
                    ]}
                  />
                  <div className={styles.app}>
                    <DefaultHeader startups={orderedStartups} />
                    <ClientAnimate as="main" id="content" className={styles.content}>
                      {config.maintenance ? <SystemMessageDisplay code="maintenance" noRedirect /> : children}
                    </ClientAnimate>
                    <DefaultFooter id="footer" />
                  </div>
                </SkeletonTheme>
              </MuiDsfrThemeProvider>
            </DsfrProvider>
          </AppRouterCacheProvider>
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
