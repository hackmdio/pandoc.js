import { spawn, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';

const binaryRootPath = path.join(__dirname, '../.pandoc-local');

type Nullable<T> = { [P in keyof T]?: T[P] | null };

type PandocOptions = {
  pandocBin: string;
  pandocCiteProcBin: string;
};

const defaultPandocOption = {
  pandocBin: path.join(binaryRootPath, 'pandoc'),
  pandocCiteProcBin: path.join(binaryRootPath, 'pandoc-citeproc'),
};

export enum InputFormat {
  commonmark = 'commonmark',
  creole = 'creole',
  docbook = 'docbook',
  docx = 'docx',
  dokuwiki = 'dokuwiki',
  epub = 'epub',
  fb2 = 'fb2',
  gfm = 'gfm',
  markdown_github = 'markdown_github',
  haddock = 'haddock',
  html = 'html',
  ipynb = 'ipynb',
  jats = 'jats',
  json = 'json',
  latex = 'latex',
  markdown = 'markdown',
  markdown_mmd = 'markdown_mmd',
  markdown_phpextra = 'markdown_phpextra',
  markdown_strict = 'markdown_strict',
  mediawiki = 'mediawiki',
  man = 'man',
  muse = 'muse',
  native = 'native',
  odt = 'odt',
  opml = 'opml',
  org = 'org',
  rst = 'rst',
  t2t = 't2t',
  textile = 'textile',
  tikiwiki = 'tikiwiki',
  twiki = 'twiki',
  vimwiki = 'vimwiki'
}

export enum OutputFormat {
  asciidoc = 'asciidoc',
  asciidoctor = 'asciidoctor',
  beamer = 'beamer',
  commonmark = 'commonmark',
  context = 'context',
  docbook = 'docbook',
  docbook4 = 'docbook4',
  docbook5 = 'docbook5',
  docx = 'docx',
  dokuwiki = 'dokuwiki',
  dzslides = 'dzslides',
  epub = 'epub',
  epub2 = 'epub2',
  epub3 = 'epub3',
  fb2 = 'fb2',
  gfm = 'gfm',
  haddock = 'haddock',
  html = 'html',
  html4 = 'html4',
  html5 = 'html5',
  icml = 'icml',
  ipynb = 'ipynb',
  jats = 'jats',
  jira = 'jira',
  json = 'json',
  latex = 'latex',
  man = 'man',
  markdown = 'markdown',
  markdown_github = 'markdown_github',
  markdown_mmd = 'markdown_mmd',
  markdown_phpextra = 'markdown_phpextra',
  markdown_strict = 'markdown_strict',
  mediawiki = 'mediawiki',
  ms = 'ms',
  muse = 'muse',
  native = 'native',
  odt = 'odt',
  opendocument = 'opendocument',
  opml = 'opml',
  org = 'org',
  plain = 'plain',
  pptx = 'pptx',
  revealjs = 'revealjs',
  rst = 'rst',
  rtf = 'rtf',
  s5 = 's5',
  slideous = 'slideous',
  slidy = 'slidy',
  tei = 'tei',
  texinfo = 'texinfo',
  textile = 'textile',
  xwiki = 'xwiki',
  zimwiki = 'zimwiki',
}

const defaults = <T extends {}>(options: Nullable<T>, defaultOption: T): T =>
  Object.keys(defaultOption).reduce(
    (acc, key) => ({
      ...acc,
      [key]: options[key] || defaultOption[key],
    }),
    {},
  ) as T;

class Pandoc {
  defaultOptions: PandocOptions;

  constructor(options: Nullable<PandocOptions> = {}) {
    this.defaultOptions = defaults(options, defaultPandocOption);
  }

  stream = (
    from: InputFormat,
    to: OutputFormat,
    args?: string[],
    options?: SpawnOptionsWithoutStdio,
  ) => {
    const defaultArgs = ['-f', from, '-t', to];

    // append additional args to end
    const arg =
      args && args.length > 0 ? [...defaultArgs, ...args] : defaultArgs;

    // start pandoc (with or without options)

    if (typeof options !== 'undefined') {
      return spawn(this.defaultOptions.pandocBin, arg);
    } else {
      return spawn(this.defaultOptions.pandocBin, arg, options);
    }
  };

  promisifyStream (stream: ChildProcessWithoutNullStreams, cb = null): Promise<string> {
    return new Promise((resolve, reject) => {
      let result = '';
      let error = '';

      // listen on error
      stream.on('error', function(err) {
        return reject(err);
      });

      // collect result data
      stream.stdout.on('data', function(data) {
        result += data;
      });

      // collect error data
      stream.stderr.on('data', function(data) {
        error += data;
      });

      // listen on exit
      stream.on('close', function(code) {
        let msg = '';
        if (code !== 0) {
          msg += 'pandoc exited with code ' + code + (error ? ': ' : '.');
        }

        if (error) {
          msg += error;
        }

        if (msg) {
          return reject(new Error(msg));
        }

        resolve(result);
      });

      // do more on stream
      if (cb) {
        cb(stream)
      }
    })
  }

  convert(
    src: string,
    from: InputFormat,
    to: OutputFormat,
    args?: string[],
    options?: SpawnOptionsWithoutStdio,
  ) {
    const pandoc = this.stream(from, to, args, options);

    return this.promisifyStream(pandoc, stream => {
      // finally, send source string
      stream.stdin.end(src, 'utf8');
    })
  }

  convertFromFile (input: string, to: OutputFormat, output: string, args: string[] = [], options?: SpawnOptionsWithoutStdio) {
    return this.promisifyStream(spawn(this.defaultOptions.pandocBin, [
      input,
      '-t', to,
      '-o', output,
      ...args
    ], options));
  }

  convertToFile(str: string, from: InputFormat, to: OutputFormat, output: string, args?: string[], options?: SpawnOptionsWithoutStdio) {
    return this.convert.bind(this)(
      str,
      from,
      to,
      [
        '-o', output,
        ...(args || [])
      ],
      options
    )
  }
}

export { Pandoc };
export default Pandoc;
