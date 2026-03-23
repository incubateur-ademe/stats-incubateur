import { fr } from "@codegouvfr/react-dsfr";

import { ClipLoader } from "@/components/ReactSpinners";

const DefaultLoading = () => {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
      <ClipLoader color={fr.colors.decisions.text.default.grey.default} size="4em" />
    </div>
  );
};

export default DefaultLoading;
