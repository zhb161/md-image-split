# MD Image Localizer

A pure frontend tool for converting external images in Markdown files to local images, updating image references to relative paths.

## Features

- 🖼️ **Image Localization**: Automatically download external images in Markdown to local files
- 📂 **File Organization**: Create an images folder to store downloaded images
- 🔄 **Link Updates**: Automatically update image links in Markdown to relative paths
- 💾 **One-Click Export**: Package processed Markdown and images for download
- 🚀 **Pure Frontend Implementation**: No backend service required, runs entirely in the browser
- 🌐 **Cross-Origin Handling**: Supports processing images from various sources, including hotlink-protected images

## Online Usage

Visit [https://md-image-split.vercel.app/](https://md-image-split.vercel.app/) to use the tool directly online.

## Local Installation and Running

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

### Installation Steps

1. Clone the repository

```bash
git clone https://github.com/zhb161/md-image-split.git
cd md-image-split
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Start the development server

```bash
npm run dev
# or
yarn dev
```

4. Visit `http://localhost:3000` in your browser

### Building a Static Website

If you want to build a static website for deployment to any web server:

```bash
npm run build
# or
yarn build
```

After building, all static files will be in the `out` directory.

### Preview Static Website Locally

You can use the following command to preview the built static website locally:

```bash
cd out && npx serve
```

This will start a local server, typically serving the static website at `http://localhost:3000`. You can also access it from other devices on your network using the network address shown in the command output.

## How to Use

1. **Upload Markdown File**: Click or drag a Markdown file to the upload area
2. **Process Images**: Click the "Process Images" button and wait for processing to complete
3. **View Results**: After processing, you can view successfully processed images and error information
4. **Download Files**: Click the "Download Processed MD File" button to download the processed file, or wait for the automatic ZIP package download

## Technology Stack

- **Frontend Framework**: Next.js 14 + React 18
- **UI Components**: Ant Design 5
- **Code Editor**: Monaco Editor
- **Packaging Tool**: JSZip
- **File Processing**: File-Saver

## Notes

- Due to browser security restrictions, some hotlink-protected images may not download
- Processing large Markdown files or many images may take a longer time
- It's recommended not to close or refresh the browser during processing

## Privacy Statement

- All file processing is done entirely in the browser locally, no data is uploaded to any server
- We do not collect or store your Markdown content or image data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contribution Guidelines

Issue reports and feature suggestions are welcome. If you want to contribute code, please first open an issue to discuss your ideas.

## Contact

For any questions or suggestions, please contact us through:

- GitHub Issues: [Submit an issue](https://github.com/zhb161/md-image-split/issues) 