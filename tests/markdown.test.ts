import { describe, expect, it } from 'vitest';
import { boldHeadings, bullets, normalizeSpaces, sections, stripLinks, tables, yesNo } from '../src/core/markdown.js';

describe('sections', () => {
  const body = ['# Top', 'intro', '## A', '<a name="a-anchor"></a>', 'body a', '### A1', 'deep', '## B', 'body b'].join('\n');

  it('finds every heading with its anchor', () => {
    const s = sections(body);
    expect(s.map((x) => x.title)).toEqual(['Top', 'A', 'A1', 'B']);
    expect(s[1]!.anchor).toBe('a-anchor');
  });

  it('text stops at the next heading, block runs to the next peer', () => {
    const a = sections(body).find((x) => x.title === 'A')!;
    expect(a.text).not.toContain('deep');
    expect(a.block).toContain('deep');
    expect(a.block).not.toContain('body b');
  });
});

describe('stripLinks', () => {
  it('keeps the label and drops images and backticks', () => {
    expect(stripLinks('[Malware Protection for EC2](malware-protection.md)')).toBe(
      'Malware Protection for EC2',
    );
    expect(stripLinks('![](icon.png) Yes')).toBe('Yes');
    expect(stripLinks('`ap-east-2`')).toBe('ap-east-2');
  });
});

describe('bullets', () => {
  it('reads top-level bullets and keeps nested ones out', () => {
    const b = bullets('+ Amazon Route 53 hosted zones.\n+ The following:\n  + Application Load Balancers.');
    expect(b.map((x) => x.value)).toEqual(['Amazon Route 53 hosted zones.', 'The following:']);
    expect(bullets('  + Application Load Balancers.', 2)[0]!.value).toBe(
      'Application Load Balancers.',
    );
  });
});

describe('tables', () => {
  const md = ['| Resource type | US East (Ohio) |', '| --- | --- |', '| AWS::S3::Bucket | ![](ok.png) Yes |', '| AWS::EC2::Instance | ![](no.png) No |'].join('\n');

  it('reads headers and rows', () => {
    const t = tables(md)[0]!;
    expect(t.headers).toEqual(['Resource type', 'US East (Ohio)']);
    expect(t.rows).toEqual([['AWS::S3::Bucket', 'Yes'], ['AWS::EC2::Instance', 'No']]);
    expect(t.rawRows[0]).toContain('AWS::S3::Bucket');
  });

  it('reads yes and no cells', () => {
    expect(yesNo('Yes')).toBe(true);
    expect(yesNo('![](x.png) No')).toBe(false);
    expect(yesNo('maybe')).toBeUndefined();
  });
});

describe('boldHeadings', () => {
  it('splits AWS run-in headings into title and body', () => {
    const md = '**RDS Protection**  \nnot supported in Taipei.\n**Lambda Protection**  \nfine.';
    const h = boldHeadings(md);
    expect(h.map((x) => x.title)).toEqual(['RDS Protection', 'Lambda Protection']);
    expect(h[0]!.body).toContain('Taipei');
    expect(h[0]!.body).not.toContain('fine');
  });
});

describe('normalizeSpaces', () => {
  it('turns a non-breaking space into an ordinary one so matching works', () => {
    expect(normalizeSpaces('Amazon Route 53 hosted zones.')).toBe(
      'Amazon Route 53 hosted zones.',
    );
    expect(stripLinks('Amazon Route 53 hosted zones.')).toBe('Amazon Route 53 hosted zones.');
  });
});

describe('stripLinks with nested links', () => {
  it('unwraps a footnote link inside a row link', () => {
    expect(stripLinks('[Amazon RDS ([Info](#note-rds))](https://x/rds.html)')).toBe(
      'Amazon RDS (Info)',
    );
  });
});

describe('yesNo with AWS trailers', () => {
  it('reads the verdict and ignores the trailing link', () => {
    expect(yesNo('Yes <br /> Learn more')).toBe(true);
    expect(yesNo('Yes Learn more')).toBe(true);
    expect(yesNo('No <br /> Learn more')).toBe(false);
    expect(yesNo('Not supported')).toBeUndefined();
  });
});
