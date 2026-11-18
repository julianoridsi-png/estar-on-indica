import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/shared/marketing/legal-page";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { REFERRAL_STATUS_OPTIONS } from "@/features/indicacoes/services/status";
import { LEGAL_LAST_UPDATE } from "@/shared/lib/legal";

export const metadata: Metadata = {
 title: "Regras da Campanha",
 description:
 "Regras de participação, status das indicações e critérios de recompensa do Estar On Indica.",
};

const RULE_VERSION = "1.0";

export default function RulesPage() {
 return (
 <LegalPage
 title="Regras da Campanha"
 description="Entenda como funcionam as indicações, o fluxo de status e os critérios para liberação de recompensas."
 version={RULE_VERSION}
 updatedAt={LEGAL_LAST_UPDATE}
 >
 <LegalSection id="programa" title="1. Programa de indicação">
 <p>
 O Estar On Indica é o programa de indicação da Estar On Internet.
 Clientes cadastrados podem indicar pessoas de confiança interessadas
 em contratar serviços de internet.
 </p>
 <p>
 A indicação não garante contratação, instalação ou recompensa. A
 contratação depende de cobertura, viabilidade técnica, análise
 comercial e aceite da pessoa indicada.
 </p>
 </LegalSection>

 <LegalSection id="elegibilidade" title="2. Quem pode participar">
 <ul className="list-disc space-y-1.5 pl-5">
 <li>Pessoas físicas maiores de 18 anos, com CPF válido.</li>
 <li>Usuários com cadastro ativo e dados corretos na plataforma.</li>
 <li>Usuários que tenham aceitado os Termos de Uso e a Política de Privacidade.</li>
 </ul>
 <p>
 Cada pessoa pode manter uma única conta. O sistema impede CPF
 duplicado e vínculo indevido entre contas.
 </p>
 </LegalSection>

 <LegalSection id="como-indicar" title="3. Como realizar uma indicação">
 <ol className="list-decimal space-y-1.5 pl-5">
 <li>Acesse seu painel de indicador.</li>
 <li>Informe nome completo, CPF e e-mail da pessoa indicada.</li>
 <li>Confirme a autorização da pessoa para compartilhar os dados.</li>
 <li>Envie a indicação e acompanhe o status pelo painel.</li>
 </ol>
 <p>
 O sistema registra automaticamente o identificador da indicação, o
 indicador responsável, a data e a hora, o status inicial e o histórico
 de movimentações.
 </p>
 </LegalSection>

 <LegalSection id="status" title="4. Status das indicações">
 <p>
 Todas as indicações percorrem o mesmo fluxo de acompanhamento. Os
 status possíveis são:
 </p>
 <div className="mt-4 space-y-2">
 {REFERRAL_STATUS_OPTIONS.map((status) => (
 <div
 key={status.value}
 className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
 >
 <StatusBadge status={status.value} className="w-fit" />
 <p className="text-[11px] text-muted-foreground sm:max-w-[70%] sm:text-right">
 {status.description}
 </p>
 </div>
 ))}
 </div>
 <p>
 Alterações de status são realizadas exclusivamente pela equipe
 autorizada da Estar On e ficam registradas com data, responsável e
 histórico.
 </p>
 </LegalSection>

 <LegalSection id="recompensa" title="5. Critérios de recompensa">
 <p>
 O tipo de recompensa, o valor, o critério de liberação e o prazo são
 definidos na campanha vigente pelo administrador da plataforma.
 </p>
 <p>
 A campanha pode prever, por exemplo, recompensa após o contrato
 aprovado ou após a instalação concluída. O critério aplicável é sempre
 o registrado na campanha ativa no momento da validação da indicação.
 </p>
 <p>
 A recompensa pode assumir as formas de desconto na mensalidade, crédito
 na fatura, premiação em dinheiro ou outra modalidade cadastrada. Cada
 modalidade pode ter condições específicas de uso e validade.
 </p>
 </LegalSection>

 <LegalSection id="liberacao" title="6. Liberação e pagamento">
 <p>
 A recompensa passa pelos estados pendente, aprovada, disponível e paga,
 podendo ser cancelada. A liberação ocorre somente após a validação e o
 cumprimento das regras da campanha.
 </p>
 <p>
 A plataforma não executa pagamentos automáticos. O pagamento ou a
 aplicação de benefícios depende de autorização expressa e do
 procedimento interno da Estar On, com registro no histórico financeiro.
 </p>
 </LegalSection>

 <LegalSection id="antifraude" title="7. Proteções e antifraude">
 <p>Não são permitidos:</p>
 <ul className="list-disc space-y-1.5 pl-5">
 <li>Indicar a si próprio ou usar dados de terceiros sem autorização.</li>
 <li>Cadastrar CPFs duplicados ou indicações repetidas.</li>
 <li>Criar cadastros com informações falsas ou incompletas.</li>
 <li>Utilizar automações ou mecanismos para burlar validações.</li>
 <li>Tentar acessar dados de outros indicadores ou indicações.</li>
 </ul>
 <p>
 Indicações com indícios de fraude podem ser reprovadas, canceladas ou
 auditadas. Contas envolvidas podem ser suspensas.
 </p>
 </LegalSection>

 <LegalSection id="cancelamento" title="8. Cancelamento e reprovação">
 <p>
 Uma indicação pode ser cancelada em caso de desistência, inconsistência
 de dados, impossibilidade técnica ou encerramento da campanha. Pode ser
 reprovada quando não atender aos critérios ou às regras antifraude.
 </p>
 <p>
 Indicações fora da área de cobertura recebem o status específico e não
 geram recompensa, salvo disposição diversa na campanha vigente.
 </p>
 </LegalSection>

 <LegalSection id="vigencia" title="9. Vigência e alterações">
 <p>
 A campanha tem data de início e encerramento definidas pelo
 administrador. Alterações de regras, valores ou critérios serão
 refletidas na campanha vigente e comunicadas na plataforma.
 </p>
 <p>
 Indicações registradas antes de uma alteração serão avaliadas conforme
 as regras aplicáveis no momento do registro, salvo disposição diversa
 informada de forma clara.
 </p>
 </LegalSection>

 <LegalSection id="privacidade" title="10. Privacidade e consentimento">
 <p>
 Ao indicar alguém, você declara que a pessoa autorizou o
 compartilhamento dos dados para fins do programa. Os dados da pessoa
 indicada serão tratados para contato, análise de cobertura,
 contratação e acompanhamento.
 </p>
 <p>
 As regras de tratamento de dados estão detalhadas na{" "}
 <Link
 href="/privacidade"
 className="font-semibold text-brand-700 hover:underline"
 >
 Política de Privacidade
 </Link>
 .
 </p>
 </LegalSection>
 </LegalPage>
 );
}
