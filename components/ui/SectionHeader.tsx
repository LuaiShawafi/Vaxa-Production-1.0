type SectionHeaderProps = {
  title: string;
  lead?: string;
  action?: React.ReactNode;
};

export function SectionHeader({ title, lead, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-h3 font-bold">{title}</h2>
        {lead ? <p className="mt-1 text-body-small text-muted">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}
