import { AccountIntegrationsPage } from "@/features/account/components/AccountIntegrationsPage";

type Props = {
  searchParams: Promise<{ steam?: string }>;
};

export default async function AccountIntegrationsRoute({ searchParams }: Props) {
  const { steam } = await searchParams;
  return <AccountIntegrationsPage result={steam} />;
}
