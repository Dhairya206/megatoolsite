import { Tool } from '../types';

export const TOOLS: Tool[] = [
  // --- IMAGE CATEGORY (10 Tools) ---
  {
    id: 'image-to-pdf',
    name: 'Image to PDF Converter',
    description: 'Convert and compile multiple images (JPG, PNG) into a single, high-quality PDF document instantly offline.',
    category: 'Image',
    icon: 'Image',
    isCore: true,
    keywords: ['image to pdf', 'convert jpg to pdf', 'png to pdf', 'compile images', 'make pdf', 'pdf compiler']
  },
  {
    id: 'image-compressor',
    name: 'Image Size Compressor',
    description: 'Reduce image file size without losing quality. Set a precision compression level and download compressed JPG/PNG.',
    category: 'Image',
    icon: 'FileImage',
    isCore: true,
    keywords: ['image size compressor', 'compress jpg', 'reduce photo size', 'optimize image', 'png compressor']
  },
  {
    id: 'image-bg-remover',
    name: 'Background Remover (Solid/Chroma)',
    description: 'Instantly remove solid white, black, or custom-colored backgrounds of any image to make it transparent completely offline.',
    category: 'Image',
    icon: 'Split',
    isCore: true,
    keywords: ['remove background', 'transparent background', 'bg remover', 'make background transparent', 'chroma key', 'image mask', 'remove background element']
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer (Width/Height)',
    description: 'Resize any image to custom pixel dimensions (width & height) or aspect ratios with high-fidelity output.',
    category: 'Image',
    icon: 'Maximize2',
    isCore: false,
    keywords: ['resize image', 'image dimensions', 'scale photo', 'change size', 'aspect ratio']
  },
  {
    id: 'image-cropper',
    name: 'Image Cropper',
    description: 'Crop unwanted outer margins of images to exact bounding areas with fully adjustable presets.',
    category: 'Image',
    icon: 'Crop',
    isCore: false,
    keywords: ['crop image', 'cut photo', 'bounding box', 'trim borders', 'photo crop']
  },
  {
    id: 'image-converter',
    name: 'Image Format Converter',
    description: 'Convert images instantly between file formats including JPG, PNG, WebP, GIF, and BMP.',
    category: 'Image',
    icon: 'RefreshCw',
    isCore: false,
    keywords: ['convert image format', 'png to jpg', 'jpg to webp', 'gif to png', 'image transcoding']
  },
  {
    id: 'color-picker',
    name: 'Image Color Picker & Palette',
    description: 'Upload an image and click anywhere to extract precise HEX, RGB, or HSL color codes with palettes.',
    category: 'Image',
    icon: 'Pipette',
    isCore: false,
    keywords: ['color picker', 'extract color from image', 'hex code', 'color palette', 'rgb finder']
  },
  {
    id: 'svg-to-png',
    name: 'SVG to PNG Converter',
    description: 'Render vector SVG code or files into static, highly polished PNG raster images with ease.',
    category: 'Image',
    icon: 'FileCode',
    isCore: false,
    keywords: ['svg to png', 'render vector svg', 'export svg', 'unvectorize logo']
  },
  {
    id: 'base64-to-image',
    name: 'Base64 to Image Decoder',
    description: 'Decode 64-base data strings back into viewable PNG, JPG, or GIF file graphics instantly.',
    category: 'Image',
    icon: 'Binary',
    isCore: false,
    keywords: ['base64 to image', 'decode base64 data', 'string to image', 'base64 viewer']
  },
  {
    id: 'image-to-base64',
    name: 'Image to Base64 Encoder',
    description: 'Convert localized JPG, PNG, or SVG graphic elements into compact browser-embeddable Base64 strings.',
    category: 'Image',
    icon: 'Replace',
    isCore: false,
    keywords: ['image to base64', 'encode image', 'base64 data-uri', 'inline image code']
  },
  {
    id: 'meme-generator',
    name: 'Meme Generator & Editor',
    description: 'Choose a canvas layout, upload any template image, write top & bottom text captions, and save!',
    category: 'Image',
    icon: 'Laugh',
    isCore: false,
    keywords: ['meme generator', 'add text to image', 'caption maker', 'funny photo maker', 'meme editor']
  },

  // --- PDF CATEGORY (10 Tools) ---
  {
    id: 'pdf-merge',
    name: 'Merge PDF Files',
    description: 'Combine multiple PDF documents into a single structural document arranged in your preferred order.',
    category: 'PDF',
    icon: 'Combine',
    isCore: false,
    keywords: ['merge pdf', 'combine pdf files', 'join pdfs', 'concatenate pdf', 'joiner']
  },
  {
    id: 'pdf-split',
    name: 'Split PDF Pages',
    description: 'Deconstruct a single multi-page PDF document into multiple smaller constituent PDF files.',
    category: 'PDF',
    icon: 'Split',
    isCore: false,
    keywords: ['split pdf', 'extract pdf pages', 'separate pdf', 'cut pdf document']
  },
  {
    id: 'pdf-extract-images',
    name: 'Extract Images from PDF',
    description: 'Extract and isolate embedded raster images or graphic elements directly from any PDF page file.',
    category: 'PDF',
    icon: 'Images',
    isCore: false,
    keywords: ['extract images from pdf', 'save pdf pictures', 'export pdf photos', 'pdf images']
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image Converter',
    description: 'Convert any PDF document pages into high-precision JPEG or PNG image files with customizable DPI scale layouts.',
    category: 'PDF',
    icon: 'Images',
    isCore: true,
    keywords: ['pdf to image', 'convert pdf to image', 'pdf page to png', 'pdf page to jpeg', 'extract pages pdf', 'pdf to jpg']
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word Converter',
    description: 'Deconstruct text formatting templates in PDF files to convert them to DOCX format structures.',
    category: 'PDF',
    icon: 'FileLock',
    isCore: false,
    keywords: ['pdf to word', 'pdf to doc', 'convert pdf to docx', 'editable document']
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF Converter',
    description: 'Convert DOCX text document formatting into secure, layouts-locked PDF documents instantly.',
    category: 'PDF',
    icon: 'FileCheck',
    isCore: false,
    keywords: ['word to pdf', 'doc to pdf', 'convert docx', 'microsoft word pdf viewer']
  },
  {
    id: 'pdf-encrypt',
    name: 'PDF Document Locker',
    description: 'Protect confidential PDF data from viewing by applying a secure password encryption standard.',
    category: 'PDF',
    icon: 'Lock',
    isCore: false,
    keywords: ['encrypt pdf', 'password protect pdf', 'lock pdf', 'pdf security key']
  },
  {
    id: 'pdf-decrypt',
    name: 'PDF Password Unlocker',
    description: 'Strip known owner validation password constraints to unlock full read-write accessibility parameters.',
    category: 'PDF',
    icon: 'Unlock',
    isCore: false,
    keywords: ['decrypt pdf', 'remove pdf password', 'unlock secure pdf', 'pdf decryption']
  },
  {
    id: 'pdf-rotate',
    name: 'Rotate PDF Pages',
    description: 'Rotate skewed landscape or upside-down pages of any PDF document by ninety-degree variations.',
    category: 'PDF',
    icon: 'RotateCw',
    isCore: false,
    keywords: ['rotate pdf', 'turn page landscape', 'invert pdf pages', 'fix page orientation']
  },
  {
    id: 'pdf-compress',
    name: 'PDF Compressor & Reducer',
    description: 'Optimize image vectors and color maps layout details to reduce PDF file disk footprint.',
    category: 'PDF',
    icon: 'Sliders',
    isCore: false,
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'optimize pdf formatting']
  },
  {
    id: 'pdf-add-watermark',
    name: 'PDF Watermark Overlayer',
    description: 'Apply semi-transparent copyright text headers or logos cleanly over each page of a PDF.',
    category: 'PDF',
    icon: 'Stamp',
    isCore: false,
    keywords: ['watermark pdf', 'copyright pdf', 'add text to pdf pages', 'protect document copy']
  },

  // --- TEXT CATEGORY (10 Tools) ---
  {
    id: 'word-counter',
    name: 'Word & Character Counter',
    description: 'Instantly count words, characters, sentences, readable speech metrics, and structural text margins in real-time.',
    category: 'Text',
    icon: 'Hash',
    isCore: true,
    keywords: ['word counter', 'character counter', 'count sentences', 'text stats', 'letter density']
  },
  {
    id: 'case-converter',
    name: 'Text Case Converter',
    description: 'Convert block paragraphs instantly to UPPERCASE, lowercase, Title Case, camelCase, or Sentence Case.',
    category: 'Text',
    icon: 'CaseSensitive',
    isCore: false,
    keywords: ['case converter', 'to uppercase', 'lowercase text', 'capitalize sentences', 'camelcase conversion']
  },
  {
    id: 'text-diff',
    name: 'Text Difference Checker',
    description: 'Compare two text blocks side-by-side to detect added, modified, or deleted strings instantly.',
    category: 'Text',
    icon: 'GitDiff',
    isCore: false,
    keywords: ['text diff', 'compare text', 'find difference', 'diff viewer text', 'string duplicate checker']
  },
  {
    id: 'markdown-editor',
    name: 'Markdown Editor & HTML Live Preview',
    description: 'Compose styled content using simple markdown annotations and download parsed HTML files with live preview.',
    category: 'Text',
    icon: 'BookOpen',
    isCore: false,
    keywords: ['markdown editor', 'md to html', 'markdown previewer', 'write readme markdown markup']
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    description: 'Generate standard dummy placeholder blocks of text filtered by desired numbers of words or paragraphs.',
    category: 'Text',
    icon: 'FileDigit',
    isCore: false,
    keywords: ['lorem ipsum generator', 'dummy text maker', 'placeholder paragraphs', 'designer text fill']
  },
  {
    id: 'remove-line-breaks',
    name: 'Line Break Remover',
    description: 'Clean text dumps by stripping carriage returns and extra blank lines for clean linear text layout formatting.',
    category: 'Text',
    icon: 'WrapText',
    isCore: false,
    keywords: ['remove line breaks', 'strip newlines', 'clean double spaces', 'join paragraphs single line']
  },
  {
    id: 'find-replace',
    name: 'Text Find & Replace Utility',
    description: 'Locate structural keywords inside huge paragraphs and replace them using case-matching parameters.',
    category: 'Text',
    icon: 'SearchCode',
    isCore: false,
    keywords: ['find and replace', 'search text', 'swap word matches', 'bulk replace letters']
  },
  {
    id: 'regex-tester',
    name: 'Regex Match Tester',
    description: 'Input any JavaScript Regular Expression pattern and test matches against test sample values with highlights.',
    category: 'Text',
    icon: 'CheckCircle',
    isCore: false,
    keywords: ['regex tester', 'regular expression rules', 'pattern matching check', 'test regex inputs']
  },

  // --- DEVELOPER CATEGORY (10 Tools) ---
  {
    id: 'password-generator',
    name: 'Secure Password Generator',
    description: 'Create cryptographically strong random passwords of custom lengths with specific constraints (symbols, uppercase).',
    category: 'Developer',
    icon: 'KeyRound',
    isCore: true,
    keywords: ['secure password generator', 'cryptographic key maker', 'random code creator', 'strong lock symbols']
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    description: 'Beautify raw, minified JSON objects into clean tree formats and check for syntax errors instantly.',
    category: 'Developer',
    icon: 'Braces',
    isCore: false,
    keywords: ['json formatter', 'beautify json', 'lint json', 'parse nested objects', 'minify array']
  },
  {
    id: 'html-formatter',
    name: 'HTML/CSS Beautifier',
    description: 'Format tag spacing, indentation hierarchies, and nesting standards for your HTML elements and style nodes.',
    category: 'Developer',
    icon: 'Code2',
    isCore: false,
    keywords: ['html formatter', 'beautify css source', 'indent codes', 'markup structure lint']
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder & Decoder',
    description: 'Encode parameters safely for browser address bars, or decode percentage-escaped characters.',
    category: 'Developer',
    icon: 'Globe',
    isCore: false,
    keywords: ['url encode', 'uri decode', 'percent encoding conversion', 'sanitize get parameters']
  },
  {
    id: 'base64-converter',
    name: 'Base64 String Encoder/Decoder',
    description: 'Convert standard UTF-8 text strings into computer-readable Base64 and vice versa safely.',
    category: 'Developer',
    icon: 'Shuffle',
    isCore: false,
    keywords: ['base64 encoder text', 'b64 decoding', 'binary raw strings', 'encrypt text ascii']
  },
  {
    id: 'hash-generator',
    name: 'Cryptographic Hash Generator',
    description: 'Generate SHA-256, MD5, or SHA-1 hashes of any text input, running completely local on your browser.',
    category: 'Developer',
    icon: 'Key',
    isCore: false,
    keywords: ['sha-256 hash', 'md5 checksum maker', 'sha1 encryption generator', 'unhash verify']
  },
  {
    id: 'epoch-converter',
    name: 'Unix Epoch Counter & Converter',
    description: 'Translate raw unix epoch timestamps into human-readable local times, timezones, and dates.',
    category: 'Developer',
    icon: 'CalendarDays',
    isCore: false,
    keywords: ['epoch timestamp converter', 'unix time convertor', 'ticks to human date', 'seconds zone helper']
  },
  {
    id: 'diff-viewer',
    name: 'Code Diff & Match Viewer',
    description: 'Compare syntax files or codes side by side with highlighted additions/deletions for simple code visual debugging.',
    category: 'Developer',
    icon: 'Flame',
    isCore: false,
    keywords: ['code diff visualizer', 'compare scripts code', 'file difference highlights', 'syntax debug lines']
  },
  {
    id: 'color-converter',
    name: 'HEX / RGB / HSL Color Translator',
    description: 'Input any format color key and convert it into HEX string, functional RGB code, or HSL scales.',
    category: 'Developer',
    icon: 'Palette',
    isCore: false,
    keywords: ['convert hex colors', 'rgb functional translator', 'hsl color model ratios', 'css color parameters']
  },
  {
    id: 'yaml-json',
    name: 'YAML to JSON & JSON to YAML',
    description: 'Seamlessly convert structured static config structures between YAML layouts and pure JSON objects.',
    category: 'Developer',
    icon: 'Database',
    isCore: false,
    keywords: ['yaml to json', 'json to yaml convert converter', 'kubernetes properties file', 'parser nesting config']
  },

  // --- UTILITIES CATEGORY (10 Tools) ---
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Generate customizable, clean QR Codes from any text link or metadata. Adjust colors and export as high-quality PNG graphics.',
    category: 'Utilities',
    icon: 'QrCode',
    isCore: true,
    keywords: ['qr code generator', 'make local qr code', 'download barcode', 'url qr scanner graphic']
  },
  {
    id: 'qr-reader',
    name: 'QR Code Reader & Scanner',
    description: 'Upload a QR code graphic or allow camera frame access to read decoded links or embedded texts instantly.',
    category: 'Utilities',
    icon: 'Scan',
    isCore: false,
    keywords: ['read qr code', 'scan bar code', 'decode qr image', 'camera barcode recognizer']
  },
  {
    id: 'calculator',
    name: 'Scientific Calculator Engine',
    description: 'Perform advanced formula computations, log functions, trigonometric variables, and math operators.',
    category: 'Utilities',
    icon: 'Calculator',
    isCore: false,
    keywords: ['web calculator', 'advanced math formula solver', 'solve logarithm trigonometry', 'standard calculations']
  },
  {
    id: 'unit-converter',
    name: 'Universal Unit Converter',
    description: 'Convert values of physical quantities such as length, weight, temperature, fluid volume, area, and speed.',
    category: 'Utilities',
    icon: 'Scale',
    isCore: false,
    keywords: ['convert distance units', 'metric conversion calculator', 'fahrenheit to celsius ratios', 'lbs to kilograms scale']
  },
  {
    id: 'currency-converter',
    name: 'Live Currency Converter',
    description: 'Calculate real-time financial conversions across global currencies like USD, EUR, GBP, JPY, and INR.',
    category: 'Utilities',
    icon: 'DollarSign',
    isCore: false,
    keywords: ['live currency exchange calculator', 'forex converter tool', 'dollars to euros multiplier', 'financial market rate']
  },
  {
    id: 'stopwatch-timer',
    name: 'Stopwatch & Pomodoro Timer',
    description: 'An elegant timing clock to track active lap iterations or run customizable countdown alarms with audio prompts.',
    category: 'Utilities',
    icon: 'Timer',
    isCore: false,
    keywords: ['lap stopwatch web', 'pomodoro focus countdown', 'beeping kitchen alarm clock', 'time countdown timer']
  },
  {
    id: 'timezone-converter',
    name: 'Global Timezone Coordinator',
    description: 'Coordinate multiple cities relative times side by side to plan international phone calls and calendar dates.',
    category: 'Utilities',
    icon: 'Clock',
    isCore: false,
    keywords: ['world clock viewer', 'timezone comparison converter', 'utc offset offsets slider', 'international meeting coordinate']
  },
  {
    id: 'expense-tracker',
    name: 'Client-Side Budget & Expense Tracker',
    description: 'Input transaction descriptions, cost categories, and values to maintain a dashboard overview of spending habits.',
    category: 'Utilities',
    icon: 'TrendingUp',
    isCore: false,
    keywords: ['simple expense log', 'monthly budget tracker', 'client financial tracker', 'ledger spending charts']
  },
  {
    id: 'random-selector',
    name: 'Random Selector & Wheel Spinner',
    description: 'Input any set of names or decision choices to run a random selector wheel to pick a winner fairly.',
    category: 'Utilities',
    icon: 'Dices',
    isCore: false,
    keywords: ['draw a random entry names', 'spin the wheel luck', 'random choice picker', 'giveaway sweepstakes decider']
  },
  {
    id: 'mp4-to-mp3',
    name: 'MP4 to MP3 Audio Extractor',
    description: 'Extract audio channels from MP4 files to high-fidelity MP3/WAV tracks offline. Crop, trim, and adjust gain details.',
    category: 'Utilities',
    icon: 'Volume2',
    isCore: true,
    keywords: ['mp4 to mp3', 'video to audio converter', 'extract audio from video', 'mp4 sound extractor', 'wav converter', 'mp4 to wav']
  }
];
