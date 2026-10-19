import { useState } from 'react';
import { AppPane } from '@/components/page';
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

  let page;
  if (view === 'settings') page = <Settings payments={false} user={user} care={care} onCare={onCare} onSaveUser={onSaveUser} onFlash={onFlash} />;
  else if (view === 'profile') page = <Profile caregiver={caregiverById(caregiverId)} user={user} market={market} onSaveProfile={onSaveProfile} />;
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
