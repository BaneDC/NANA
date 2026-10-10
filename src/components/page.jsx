import { cn } from '@/lib/utils';

// The page every screen is (docs/patterns.md §3, §4), in Tailwind: what
// `.view`, `.view-head` and `.section` were.
//
//   <Page>
//     <BackButton … />                       only when there is a way back
//     <PageHeader>
//       <PageHeaderText>
//         <PageTitle>Naslov</PageTitle>
//         <PageDescription>Jedna rečenica.</PageDescription>
//       </PageHeaderText>
//       <PageActions>…</PageActions>         the page's actions, right
//     </PageHeader>
//     <PageSection title="Plaćanje">…cards…</PageSection>
//   </Page>
//
// The page scrolls, 24 from the pane's edges (16 on a phone), its parts 12
// apart and at most 720 wide; with a back button first it starts 16 from the
// top. Groups are 32 apart (12 + 20).

// The white pane the app's pages, the chat and the caregiver's board sit in:
// the rest of the screen beside the menu, 24 corners and the container's
// shadow; on a narrow screen it runs to the bottom edge, square there.
export function AppPane({ className, ...props }) {
  return (
    <div
      data-slot="app-pane"
      className={cn(
        'relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-card shadow-container narrow:rounded-b-none',
        className
      )}
      {...props}
    />
  );
}

// The scrollbar's room is kept on both sides whether or not the page scrolls,
// so a page that grows past the screen (another tab, "Prikaži još") does not
// slide sideways when the scrollbar comes, and the column stays in the middle.
export function Page({ className, ...props }) {
  return (
    <div
      data-slot="page"
      className={cn(
        'flex min-h-0 flex-1 flex-col items-stretch gap-3 overflow-y-auto p-6 [scrollbar-gutter:stable_both-edges] phone:px-4 phone:pt-4 phone:pb-6',
        '*:mx-auto *:w-full *:max-w-[720px] has-[>[data-slot=back-button]:first-child]:pt-4',
        '[&>[data-slot=page-section]+[data-slot=page-section]]:mt-5',
        className
      )}
      {...props}
    />
  );
}

// The text left, the actions right and 32 from it, so a long subtitle never
// reaches a button. The text starts 16 in, where the text in the cards under
// it does (docs/patterns.md §4); the actions stay on the cards' right edge. On a phone the title and the actions share the first line
// and the subtitle runs under both, the full width.
export function PageHeader({ className, ...props }) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        'mb-2 flex items-start gap-8 pl-4',
        'phone:grid phone:grid-cols-[minmax(0,1fr)_auto] phone:gap-x-3 phone:gap-y-0',
        'phone:[&>:not([data-slot=page-header-text])]:col-start-2 phone:[&>:not([data-slot=page-header-text])]:row-start-2',
        // a person's page: her name keeps the first line, the actions go under it
        'phone:[&>[data-slot=page-person]]:col-span-full phone:has-[>[data-slot=page-person]]:[&>[data-slot=page-actions]]:col-span-full phone:has-[>[data-slot=page-person]]:[&>[data-slot=page-actions]]:row-start-3 phone:has-[>[data-slot=page-person]]:[&>[data-slot=page-actions]]:mt-3 phone:has-[>[data-slot=page-person]]:[&>[data-slot=page-actions]]:justify-start',
        className
      )}
      {...props}
    />
  );
}

export function PageHeaderText({ className, ...props }) {
  return (
    <div
      data-slot="page-header-text"
      className={cn(
        'min-w-0 flex-1 phone:contents phone:*:col-span-full phone:*:row-start-3',
        className
      )}
      {...props}
    />
  );
}

// A person's page (her avatar beside the name, docs/patterns.md §4): the
// avatar aligned with the top of the name, as tall as the title and the line
// under it (42, 48 under a finger), 12 from them. On a phone the avatar and
// the name take the whole first line, and the page's actions go under them.
export function PagePerson({ className, ...props }) {
  return (
    <div
      data-slot="page-person"
      className={cn(
        'flex min-w-0 flex-1 items-start gap-3 [--avatar:calc(var(--text-base-leading)+var(--text-body-leading))]',
        'phone:[&>[data-slot=page-header-text]]:block',
        className
      )}
      {...props}
    />
  );
}

export function PageTitle({ className, ...props }) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        'text-base font-medium text-foreground phone:col-span-1! phone:row-start-2! phone:self-center',
        className
      )}
      {...props}
    />
  );
}

export function PageDescription({ className, ...props }) {
  return (
    <p data-slot="page-description" className={cn('text-xs leading-body text-muted-foreground', className)} {...props} />
  );
}

// An icon button here is as tall as a text button beside it (32, 44 under a
// finger), not a chip's 28 (§4).
export function PageActions({ className, ...props }) {
  return (
    <div
      data-slot="page-actions"
      className={cn(
        'flex shrink-0 items-center gap-2 phone:flex-wrap phone:justify-end',
        '[&_[data-slot=button][data-size=icon]]:size-(--button-size)',
        className
      )}
      {...props}
    />
  );
}

// A group of cards under a quiet title, only when the page has more than one.
// The title starts 16 in, where the text in its cards does.
export function PageSection({ title, className, children, ...props }) {
  return (
    <section data-slot="page-section" className={cn('flex flex-col gap-3', className)} {...props}>
      {title && <h2 className="pl-4 text-small font-medium text-muted-foreground">{title}</h2>}
      {children}
    </section>
  );
}
