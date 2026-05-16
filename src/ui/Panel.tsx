import type { PropsWithChildren, ReactNode } from 'react';

type PanelProps = PropsWithChildren<{
  title: string;
  headerExtras?: ReactNode;
}>;

export function Panel({ title, headerExtras, children }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel__header">
        <span>{title}</span>
        {headerExtras ? <div className="panel__header-extras">{headerExtras}</div> : null}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}
