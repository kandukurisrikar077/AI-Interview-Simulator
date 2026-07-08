import React from 'react'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[]
  children: React.ReactNode
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-gray-950/20">
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        <thead>
          <tr className="border-b border-white/5 bg-[#101828]/45">
            {headers.map((hdr, i) => (
              <th
                key={i}
                className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                {hdr}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm text-gray-300 font-light">
          {children}
        </tbody>
      </table>
    </div>
  )
}
