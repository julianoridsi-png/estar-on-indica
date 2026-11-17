import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/shared/marketing/legal-page";
import {
  COMPANY_LEGAL_NAME,
  LEGAL_LAST_UPDATE,
  TERMS_VERSION,
} from "@/shared/lib/legal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de Uso do programa de indicação Estar On Indica, da Estar On Internet.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      description="Regras para participação no programa de indicação Estar On Indica, uso da plataforma e concessão de recompensas."
      version={TERMS_VERSION}
      updatedAt={LEGAL_LAST_UPDATE}
    >
      <LegalSection id="aceitacao" title="1. Aceitação dos termos">
        <p>
          Ao criar uma conta ou utilizar a plataforma Estar On Indica, você
          declara que leu, compreendeu e aceitou integralmente estes Termos de
          Uso e a Política de Privacidade. O aceite é registrado com data e hora
          e vinculado à sua conta.
        </p>
        <p>
          Caso não concorde com alguma condição, não utilize a plataforma nem
          realize indicações.
        </p>
      </LegalSection>

      <LegalSection id="participacao" title="2. Participação e elegibilidade">
        <p>
          O programa é destinado a pessoas físicas maiores de 18 anos,
          devidamente cadastradas como indicadoras e com CPF válido. É necessário
          fornecer dados verdadeiros, completos e atualizados.
        </p>
        <p>
          A participação é gratuita. Não há cobrança de taxa de cadastro ou de
          indicação. A {COMPANY_LEGAL_NAME} pode solicitar informações
          adicionais para validar a identidade do participante.
        </p>
      </LegalSection>

      <LegalSection id="conta" title="3. Cadastro e segurança da conta">
        <p>
          O acesso é individual e protegido por e-mail e senha. Você é
          responsável por manter a confidencialidade das suas credenciais e por
          todas as atividades realizadas na sua conta.
        </p>
        <p>
          O CPF é validado e armazenado de forma criptografada. Em caso de
          suspeita de acesso indevido, altere sua senha e comunique a equipe
          pelos canais oficiais.
        </p>
      </LegalSection>

      <LegalSection id="indicacoes" title="4. Como funciona a indicação">
        <p>
          Para cada indicação, o indicador deve informar nome completo, CPF e
          e-mail da pessoa indicada. O sistema vincula a indicação à conta do
          indicador e registra automaticamente data, hora, status inicial e
          histórico de movimentações.
        </p>
        <p>
          É proibido indicar a si próprio, criar cadastros com dados falsos,
          reutilizar CPFs ou tentar burlar os mecanismos de validação. O sistema
          bloqueia CPF duplicado, indicações repetidas e autorreferência.
        </p>
      </LegalSection>

      <LegalSection id="status" title="5. Status e acompanhamento">
        <p>
          A indicação percorre etapas como recebida, em análise, análise de
          cobertura, contato comercial, negociação, contrato aprovado,
          instalação agendada e instalado, podendo ser cancelada ou reprovada.
        </p>
        <p>
          O indicador pode acompanhar o andamento no painel, mas não pode alterar
          status, observações ou dados administrativos. As alterações são feitas
          exclusivamente por usuários autorizados da {COMPANY_LEGAL_NAME} e
          registradas em histórico e auditoria.
        </p>
      </LegalSection>

      <LegalSection id="recompensas" title="6. Critérios e recompensas">
        <p>
          O tipo, o valor, o critério de liberação e o prazo de cada recompensa
          são definidos pelo administrador na campanha vigente. A recompensa
          somente é liberada após o cumprimento integral das regras aplicáveis.
        </p>
        <p>
          A plataforma não realiza pagamentos automáticos. A liberação e o
          registro financeiro dependem de validação da equipe Estar On. Recompensas
          canceladas, reprovadas ou vinculadas a indicações canceladas não serão
          pagas.
        </p>
        <p>
          Benefícios de desconto ou crédito seguem as condições comerciais da
          campanha e podem ter prazo de validade, limite de uso e regras
          específicas.
        </p>
      </LegalSection>

      <LegalSection id="antifraude" title="7. Condutas proibidas e antifraude">
        <p>São proibidas, entre outras condutas:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Criar contas ou indicações com informações falsas.</li>
          <li>Indicar pessoas sem o conhecimento ou consentimento delas.</li>
          <li>Utilizar automações, scripts ou ferramentas para gerar cadastros.</li>
          <li>Manipular status, recompensas ou qualquer funcionalidade da plataforma.</li>
          <li>Tentar acessar dados de outros indicadores ou pessoas indicadas.</li>
        </ul>
        <p>
          A {COMPANY_LEGAL_NAME} pode suspender ou encerrar contas, cancelar
          indicações e reter recompensas em caso de fraude ou violação destes
          termos, sem prejuízo das medidas legais cabíveis.
        </p>
      </LegalSection>

      <LegalSection id="suspensao" title="8. Suspensão e encerramento">
        <p>
          A participação pode ser suspensa preventivamente durante análises de
          segurança ou verificação de dados. O encerramento da conta pode
          ocorrer por solicitação do titular, por inatividade prolongada ou por
          violação destes termos.
        </p>
        <p>
          O encerramento não elimina obrigações já assumidas, registros exigidos
          por lei ou valores pendentes de validação.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidade" title="9. Limitação de responsabilidade">
        <p>
          A plataforma é disponibilizada conforme sua operação regular. Podem
          ocorrer indisponibilidades temporárias por manutenção, falhas de
          terceiros ou eventos fora do controle da {COMPANY_LEGAL_NAME}.
        </p>
        <p>
          A indicação não garante contratação, instalação ou recompensa. A
          decisão comercial depende da viabilidade técnica, cobertura,
          análise de crédito e aceite da pessoa indicada.
        </p>
      </LegalSection>

      <LegalSection id="alteracoes" title="10. Alterações destes termos">
        <p>
          Estes termos podem ser atualizados para refletir mudanças na
          plataforma, na campanha ou na legislação. A versão vigente será sempre
          publicada nesta página, com data de atualização.
        </p>
        <p>
          Alterações relevantes poderão exigir novo aceite no acesso à
          plataforma.
        </p>
      </LegalSection>

      <LegalSection id="geral" title="11. Legislação e disposições gerais">
        <p>
          Estes termos são regidos pela legislação brasileira, em especial pelo
          Código Civil, pelo Marco Civil da Internet e pela Lei Geral de Proteção
          de Dados (LGPD).
        </p>
        <p>
          Eventuais controvérsias serão tratadas, preferencialmente, por meio de
          atendimento e negociação entre as partes. Fica preservado o direito do
          consumidor de recorrer aos órgãos de defesa competentes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
