import { Page, PageHeader, PageHeaderText, PageTitle, PageDescription, PageSection } from '@/components/page';
import AccountCard from '../components/AccountCard';
import { SignOutCard } from './Settings';
import { t } from '@/i18n';

// The family's profile, /profile, opened from the card of who is signed in at
// the foot of the menu (decided 19. 11., Branislav): their account, and
// signing out, both taken from Settings.
export default function FamilyProfile({ user, onSaveUser }) {
  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Moj profil')}</PageTitle>
          <PageDescription>{t('Vaši podaci i odjava.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>
      <PageSection title={t('Nalog')}>
        <AccountCard user={user} onSave={onSaveUser} />
      </PageSection>
      <PageSection>
        <SignOutCard />
      </PageSection>
    </Page>
  );
}
