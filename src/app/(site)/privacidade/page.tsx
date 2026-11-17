import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/shared/marketing/legal-page";
import {
  COMPANY_LEGAL_NAME,
  LEGAL_LAST_UPDATE,
  PRIVACY_VERSION,
} from "@/shared/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Estar On Indica trata dados pessoais e atende aos direitos previstos na LGPD.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      description="Transparência sobre quais dados pessoais são tratados, para quais finalidades, por quanto tempo e como exercer seus direitos como titular."
      version={PRIVACY_VERSION}
      updatedAt={LEGAL_LAST_UPDATE}
    >
      <LegalSection id="controlador" title="1. Controlador e escopo">
        <p>
          O controlador dos dados pessoais tratados na plataforma Estar On Indica
          é a {COMPANY_LEGAL_NAME}, que define as finalidades e os elementos
          essenciais do tratamento. Os dados empresariais completos, endereço e
          canal do Encarregado de Dados serão inseridos na versão oficial deste
          documento.
        </p>
        <p>
          Esta política se aplica ao site, à área autenticada do indicador e ao
          painel administrativo da plataforma.
        </p>
      </LegalSection>

      <LegalSection id="dados" title="2. Dados pessoais coletados">
        <p>Podemos tratar as seguintes categorias de dados:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Dados de identificação e contato:</strong> nome completo,
            CPF, e-mail, telefone e endereço.
          </li>
          <li>
            <strong>Dados de acesso:</strong> senha armazenada de forma segura
            pelo provedor de autenticação, data de criação e registros de sessão.
          </li>
          <li>
            <strong>Dados de indicação:</strong> nome, CPF e e-mail da pessoa
            indicada, status, histórico de movimentações e observações
            administrativas.
          </li>
          <li>
            <strong>Dados de recompensa:</strong> tipo, valor, status, critério de
            liberação e histórico financeiro.
          </li>
          <li>
            <strong>Dados de uso e segurança:</strong> registros de auditoria,
            data e hora de ações, endereço IP e informações técnicas de acesso.
          </li>
        </ul>
        <p>
          Não solicitamos dados sensíveis, como informações de saúde, biometria
          ou convicção religiosa. O CPF é armazenado criptografado e exibido de
          forma mascarada nas telas.
        </p>
      </LegalSection>

      <LegalSection id="finalidades" title="3. Finalidades e bases legais">
        <p>Os dados são tratados para:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Cadastrar e autenticar o indicador.</li>
          <li>Registrar, validar e acompanhar indicações.</li>
          <li>Verificar cobertura, contato comercial e contratação.</li>
          <li>Calcular, validar e registrar recompensas.</li>
          <li>Prevenir fraudes, duplicidades e acessos indevidos.</li>
          <li>Atender obrigações legais e regulatórias.</li>
          <li>Prestar suporte e responder a solicitações do titular.</li>
        </ul>
        <p>
          As bases legais incluem a execução de contrato ou procedimentos
          preliminares, o cumprimento de obrigação legal, o legítimo interesse
          para segurança e prevenção a fraudes e o consentimento, quando
          aplicável. O consentimento pode ser revogado a qualquer momento, sem
          afetar tratamentos realizados anteriormente.
        </p>
      </LegalSection>

      <LegalSection id="compartilhamento" title="4. Compartilhamento de dados">
        <p>
          Os dados podem ser processados por prestadores de serviços de
          infraestrutura e tecnologia estritamente necessários à operação, como
          serviços de banco de dados, autenticação e hospedagem. Esses
          fornecedores atuam como operadores e devem observar obrigações de
          segurança e confidencialidade.
        </p>
        <p>
          A {COMPANY_LEGAL_NAME} não vende dados pessoais. O compartilhamento com
          autoridades públicas ocorre apenas quando exigido por lei ou ordem
          judicial.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="5. Cookies e tecnologias semelhantes">
        <p>
          A plataforma utiliza cookies estritamente necessários para manter a
          sessão autenticada e proteger o acesso. Não utilizamos cookies de
          publicidade comportamental nesta versão.
        </p>
        <p>
          A recusa de cookies essenciais pode impedir o login e o uso das áreas
          restritas.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="6. Prazo de retenção">
        <p>
          Os dados são mantidos enquanto a conta estiver ativa e pelo período
          necessário ao cumprimento das finalidades desta política, incluindo
          prazos legais, fiscais, regulatórios e de defesa de direitos.
        </p>
        <p>
          Após o término do tratamento, os dados podem ser eliminados ou
          anonimizados, observadas as hipóteses legais de conservação. Registros
          de auditoria podem ser mantidos para segurança e comprovação de
          conformidade.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="7. Direitos do titular">
        <p>
          Nos termos da LGPD, o titular pode solicitar, conforme aplicável:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Confirmação da existência de tratamento.</li>
          <li>Acesso aos dados pessoais.</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.</li>
          <li>Portabilidade, observados os segredos comerciais e industriais.</li>
          <li>Eliminação de dados tratados com consentimento, ressalvadas as hipóteses legais.</li>
          <li>Informação sobre compartilhamentos realizados.</li>
          <li>Revogação do consentimento.</li>
        </ul>
        <p>
          As solicitações podem ser feitas pelos canais oficiais de atendimento
          da Estar On. Poderemos solicitar informações adicionais para confirmar
          a identidade do titular e evitar acesso indevido. A resposta observará
          os prazos legais aplicáveis.
        </p>
      </LegalSection>

      <LegalSection id="seguranca" title="8. Segurança da informação">
        <p>
          Adotamos medidas técnicas e administrativas para proteger os dados,
          incluindo:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Controle de acesso por perfil e Row Level Security no banco.</li>
          <li>Criptografia do CPF e mascaramento nas interfaces.</li>
          <li>Senhas gerenciadas pelo provedor de autenticação, sem armazenamento em texto puro.</li>
          <li>Registro de auditoria de ações sensíveis.</li>
          <li>Validação de dados no frontend e no backend.</li>
          <li>Restrição de acesso administrativo a usuários autorizados.</li>
        </ul>
        <p>
          Nenhum sistema é completamente imune a incidentes. Em caso de incidente
          relevante, adotaremos as providências cabíveis e as comunicações
          exigidas pela LGPD.
        </p>
      </LegalSection>

      <LegalSection id="internacional" title="9. Transferência internacional">
        <p>
          Os prestadores de infraestrutura podem processar dados em servidores
          localizados fora do Brasil. Quando isso ocorrer, adotaremos mecanismos
          contratuais e verificações compatíveis com a LGPD para assegurar nível
          adequado de proteção.
        </p>
      </LegalSection>

      <LegalSection id="encarregado" title="10. Encarregado de Dados (DPO)">
        <p>
          A indicação formal do Encarregado de Dados e seu canal de contato
          constarão na versão oficial desta política. Até a designação, as
          solicitações serão acolhidas pelos canais oficiais de atendimento da{" "}
          {COMPANY_LEGAL_NAME}.
        </p>
      </LegalSection>

      <LegalSection id="atualizacoes" title="11. Atualizações desta política">
        <p>
          Esta política pode ser atualizada para refletir mudanças nos
          tratamentos, na legislação ou na operação da plataforma. A versão
          vigente será publicada com data de atualização e número de versão.
        </p>
        <p>
          Alterações que afetem materialmente os titulares poderão ser
          comunicadas pelos canais de contato cadastrados.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
