import { Download, Printer } from "lucide-react";

export default function ReportExportActions({
    id,
    disabled = false,
}: {
    id: number;
    disabled?: boolean;
}) {
    return (
        <div className="s4-export-actions">
            {disabled || !id ? (
                <p className="s4-caption">
                    Simpan seluruh perubahan sebelum mengekspor laporan.
                </p>
            ) : (
                <>
                    <a
                        className="learning-button secondary"
                        href={`/reports/${id}/export?format=md`}
                    >
                        <Download size={16} />
                        Unduh Markdown
                    </a>
                    <a
                        className="learning-button secondary"
                        href={`/reports/${id}/export?format=html`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Printer size={16} />
                        Versi Cetak HTML
                    </a>
                </>
            )}
        </div>
    );
}
