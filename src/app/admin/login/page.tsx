import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";

import { LoginForm } from "./LoginForm";

const LoginPage = () => (
  <DsfrPage>
    <Container py="4w">
      <h1>Connexion Administration</h1>
      <LoginForm />
    </Container>
  </DsfrPage>
);

export default LoginPage;
