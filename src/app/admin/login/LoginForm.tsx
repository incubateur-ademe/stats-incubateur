"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { type ServerActionResponse } from "@/utils/next";

import { authenticateAdmin } from "./action";

z.config(z.locales.fr());

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormData>({
    resolver: standardSchemaResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async data => {
    setServerError(null);
    const result: ServerActionResponse = await authenticateAdmin(data.login, data.password);
    if (result.ok) {
      router.replace("/admin");
    } else {
      setServerError(result.error);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      {serverError && (
        <Alert
          className="fr-mb-4w"
          description={serverError}
          severity="error"
          small
          title="Erreur d'authentification"
        />
      )}
      <Input
        label="Identifiant"
        nativeInputProps={{
          ...register("login"),
          autoComplete: "username",
        }}
        state={errors.login ? "error" : "default"}
        stateRelatedMessage={errors.login?.message}
      />
      <Input
        label="Mot de passe"
        nativeInputProps={{
          ...register("password"),
          autoComplete: "current-password",
          type: "password",
        }}
        state={errors.password ? "error" : "default"}
        stateRelatedMessage={errors.password?.message}
      />
      <Button className="fr-mt-2w" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  );
};
