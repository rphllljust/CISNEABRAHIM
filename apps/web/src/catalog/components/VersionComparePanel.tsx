import type { VersionFieldDiff } from '../utils/version-compare';

type VersionComparePanelProps = {
  leftVersion: number;
  rightVersion: number;
  diffs: VersionFieldDiff[];
};

export function VersionComparePanel({ leftVersion, rightVersion, diffs }: VersionComparePanelProps) {
  return (
    <section className="catalog-compare" aria-labelledby="catalog-compare-heading">
      <h2 id="catalog-compare-heading">
        Comparação v{leftVersion} × v{rightVersion}
      </h2>
      {diffs.length === 0 ? (
        <p role="status">Nenhuma diferença estrutural encontrada entre as versões selecionadas.</p>
      ) : (
        <div className="catalog-table-wrap">
          <table className="catalog-table" aria-label="Diferenças entre versões">
            <thead>
              <tr>
                <th scope="col">Campo</th>
                <th scope="col">v{leftVersion}</th>
                <th scope="col">v{rightVersion}</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((diff) => (
                <tr key={diff.field}>
                  <th scope="row">{diff.field}</th>
                  <td>
                    <pre className="catalog-diff-value">{diff.left}</pre>
                  </td>
                  <td>
                    <pre className="catalog-diff-value">{diff.right}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
