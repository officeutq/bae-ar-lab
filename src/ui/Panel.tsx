import type { PropsWithChildren } from 'react';

type PanelProps = PropsWithChildren<{
  title: string;
}>;

export function Panel({ title, children }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel__header">{title}</header>
      <div className="panel__body">{children}</div>
    </section>
  );
}
