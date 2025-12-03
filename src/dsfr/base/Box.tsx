import { fr } from "@codegouvfr/react-dsfr";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { forwardRef, type PropsWithChildren } from "react";

import { buildSpacingClasses, type ResponsiveSpacingProps, type SpacingProps } from "../utils/spacing";

export type BoxProps = PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> &
    ResponsiveSpacingProps &
    SpacingProps & {
      as?: "article" | "aside" | "div" | "footer" | "header" | "main" | "p" | "section" | "span";
      className?: CxArg;
    }
>;

const boxProps = ({
  className,
  m,
  mb,
  mbmd,
  ml,
  mlmd,
  mmd,
  mr,
  mrmd,
  mt,
  // responsive props
  mtmd,
  mx,
  mxmd,
  my,
  mymd,
  p,
  pb,
  pbmd,
  pl,
  plmd,
  pmd,
  pr,
  prmd,
  pt,
  ptmd,
  px,
  pxmd,
  py,
  pymd,
  ...rest
}: Omit<BoxProps, "as">): React.HTMLAttributes<HTMLDivElement> => ({
  className: cx(
    fr.cx(
      buildSpacingClasses({
        m,
        mb,
        mbmd,
        ml,
        mlmd,
        mmd,
        mr,
        mrmd,
        mt,
        mtmd,
        mx,
        mxmd,
        my,
        mymd,
        p,
        pb,
        pbmd,
        pl,
        plmd,
        pmd,
        pr,
        prmd,
        pt,
        ptmd,
        px,
        pxmd,
        py,
        pymd,
      }),
    ),
    className,
  ),
  ...rest,
});

export const Box = ({ as: HtmlTag = "div", ...rest }: BoxProps) => <HtmlTag {...boxProps(rest)} />;
export const BoxRef = forwardRef<HTMLDivElement, BoxProps>(({ as: HtmlTag = "div", ...rest }, ref) => (
  <HtmlTag ref={ref} {...boxProps(rest)} />
));

BoxRef.displayName = "BoxRef";
