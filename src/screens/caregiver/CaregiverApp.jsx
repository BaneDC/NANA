import { goBackTo, useRoute } from '../../lib/route';
import { AppPane, Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Card, CardDescription } from '@/components/ui/card';
import Attention from '../../components/Attention';
import RequestsRs from './RequestsRs';
import ClientProfile from './ClientProfile';
import Board from './Board';
import ClientPage from './ClientPage';
import Clients from './Clients';
import Earnings from './Earnings';
import Profile from './Profile';
import Settings from '../Settings';
import { useClientActions } from '../../components/caregiver/ClientDialogs';
import { caregiverById } from '../../data/carePlan';
import { t } from '@/i18n';

// The caregiver's side, inside the same shell as the family's (the menu, the
// pane, help, the simulation): her pages only, per market
// (docs/superpowers/specs/2026-10-19-negovateljice-pregled.md). Finland: her
// board, her clients and one client's page, her earnings, her profile. Serbia
// keeps the requests page until part 4.
export default function CaregiverApp({ view, openId, onView, user, market, care, clients, payouts, onPayouts, onClientCare, onCare, onSaveUser, onSaveProfile, onFlash }) {
  const caregiverId = user.caregiverId;
  // where a client's page was opened from, kept with that step of the history;
  // its "Nazad" says it and leads there (a link opened cold: the board)
  const from = useRoute().state?.from || 'board';
  const { act, dialog } = useClientActions({ caregiverId, onClientCare, onFlash });
  const open = (id) => onView('client', id, { from: view });
  const client = view === 'client' && clients.find((c) => c.id === openId);
  const fi = market !== 'sr';

  // signed up, not yet through the talk with the coordinator: her home says so
  const waiting = user.status && user.status !== 'active';
  let page;
  if (waiting && (view === 'board' || view === 'requests'))
    page = (
      <Page>
        <PageHeader>
          <PageHeaderText>
            <PageTitle>{t('Dobro došli, {name}', { name: user.firstName || user.name })}</PageTitle>
            <PageDescription>{t('Prijava je poslata.')}</PageDescription>
          </PageHeaderText>
        </PageHeader>
        <Attention title={t('Profil se aktivira posle razgovora')}>
          <Card>
            <CardDescription>
              {t('Koordinatorka vam se javlja preko kanala koji ste izabrali. Posle razgovora porodice vas vide na „Pronađi" i mogu da vam pišu. Do tada možete da dopunite profil.')}
            </CardDescription>
          </Card>
        </Attention>
      </Page>
    );
  else if (view === 'settings') page = <Settings payments={false} user={user} care={care} onCare={onCare} onSaveUser={onSaveUser} onFlash={onFlash} />;
  else if (view === 'profile') page = <Profile caregiver={caregiverById(caregiverId) || user.record} user={user} market={market} onSaveProfile={onSaveProfile} />;
  // Serbia: the requests, and a family's profile (part 4)
  else if (!fi && client) page = <ClientProfile client={client} onBack={() => goBackTo({ page: 'requests' })} act={act} />;
  else if (!fi) page = <RequestsRs user={user} clients={clients} onOpen={open} act={act} />;
  // a new request in Finland: the same page as in Serbia, answered there
  else if (client && client.stage === 'request')
    page = <ClientProfile client={client} backLabel={from === 'clients' ? t('Klijenti') : t('Tabla')} onBack={() => goBackTo({ page: from === 'clients' ? 'clients' : 'board' })} act={act} />;
  else if (client)
    page = <ClientPage client={client} caregiverId={caregiverId} backLabel={from === 'clients' ? t('Klijenti') : t('Tabla')} onBack={() => goBackTo({ page: from === 'clients' ? 'clients' : 'board' })} act={act} />;
  else if (view === 'clients') page = <Clients clients={clients} onOpen={open} />;
  else if (view === 'earnings') page = <Earnings clients={clients} caregiverId={caregiverId} payouts={payouts} onPayouts={onPayouts} />;
  else page = <Board user={user} clients={clients} caregiverId={caregiverId} onOpen={open} act={act} onEarnings={() => onView('earnings')} />;

  return (
    <AppPane>
      {page}
      {dialog}
    </AppPane>
  );
}
