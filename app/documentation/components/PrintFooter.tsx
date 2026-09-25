import React from 'react';

interface PrintFooterProps {
  hospitalName?: string;
}

export default function PrintFooter({ hospitalName }: PrintFooterProps) {
  const currentDate = new Date().toLocaleDateString('es-ES');
  return (
    <div className="w-full text-[10px] text-slate-400 border-t border-slate-200 pt-2 pb-2 flex justify-between items-center bg-white print:flex hidden mt-4 avoid-break">
      <div>
        <strong>Centro:</strong> {hospitalName || 'No asignado'}
      </div>
      <div>
        <strong>Versión Oficial:</strong> Site Pack v1.1 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Fecha Efectiva:</strong> 01/10/2026
      </div>
      <div>
        <strong>Generado el:</strong> {currentDate}
      </div>
    </div>
  );
}
