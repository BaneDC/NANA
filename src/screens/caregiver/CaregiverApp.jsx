import { useState } from 'react';
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
export default function CaregiverApp({ view, onView, user, market, care, clients, payouts, onPayouts, onClientCare, onCare, onSaveUser, onSaveProfile, onFlash }) {
  const caregiverId = user.caregiverId;
  const [openId, setOpenId] = useState(null);
  const [from, setFrom] = useState('board');
  const { act, dialog } = useClientActions({ caregiverId, onClientCare, onFlash });
  const open = (id) => {
    setFrom(view);
    setOpenId(id);
    onView('client');
  };
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
  else if (!fi && client) page = <ClientProfile client={client} onBack={() => onView('requests')} act={act} />;
  else if (!fi) page = <RequestsRs user={user} clients={clients} onOpen={open} act={act} />;
  else if (client)
    page = <ClientPage client={client} caregiverId={caregiverId} backLabel={from === 'clients' ? t('Klijenti') : t('Tabla')} onBack={() => onView(from === 'clients' ? 'clients' : 'board')} act={act} />;
  else if (view === 'clients') page = <Clients clients={clients} onOpen={open} />;
  else if (view === 'earnings') page = <Earnings clients={clients} caregiverId={caregiverId} payouts={payouts} onPayouts={onPayouts} />;
  else page = <Board user={user} clients={clients} caregiverId={caregiverId} onOpen={open} act={act} />;

  return (
    <AppPane>
      {page}
      {dialog}
    </AppPane>
  );
}
