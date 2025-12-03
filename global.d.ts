// add custom Next tags
interface NextFetchRequestConfig {
  tags?: Array<"test" | "yo" | (string & { _?: never })>;
}

declare module "@codegouvfr/react-dsfr/dsfr/*.svg" {
  import { type StaticImageData } from "next/image";

  const value: StaticImageData | string;
  export default value;
}

declare module "@/dsfr/*.svg" {
  import { type StaticImageData } from "next/image";

  const value: StaticImageData;
  export default value;
}

declare module "eslint-plugin-lodash" {
  import { type ESLint } from "eslint";

  const value: ESLint.Plugin;
  export default value;
}
