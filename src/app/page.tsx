'use client';

import { useState } from 'react';
import { Layout, Upload, message, Button, Space, Spin, Progress, Result } from 'antd';
import { 
  InboxOutlined, 
  DownloadOutlined, 
  ThunderboltOutlined, 
  FileImageOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { processMarkdown } from '@/utils/markdown';
import { saveAs } from 'file-saver';

const { Content } = Layout;
const { Dragger } = Upload;

export default function Home() {
  const [content, setContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [processProgress, setProcessProgress] = useState(0);
  const [result, setResult] = useState<{
    mdContent: string;
    images: any[];
    errors: any[];
  } | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setContent(text);
      setFileName(file.name);
      setResult(null);
      message.success(`${file.name} uploaded successfully`);
      return false;
    } catch (error) {
      message.error('Failed to read file');
      return false;
    }
  };

  const simulateProgress = () => {
    let progress = 0;
    const timer = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 1;
      if (progress >= 99) {
        clearInterval(timer);
        progress = 99;
      }
      setProcessProgress(progress);
    }, 200);

    return () => clearInterval(timer);
  };

  const handleProcess = async () => {
    if (!content) {
      message.warning('Please upload a Markdown file first');
      return;
    }

    setProcessing(true);
    setProcessProgress(0);
    
    // Simulate progress bar
    const clearProgressSimulation = simulateProgress();
    
    try {
      const processResult = await processMarkdown(content);
      setResult(processResult);
      setProcessProgress(100);
      message.success('Processing completed');
    } catch (error) {
      message.error('Processing failed');
    } finally {
      clearProgressSimulation();
      setProcessing(false);
    }
  };

  return (
    <Layout className="min-h-screen">
      <header className="site-header">
        <h1>
          <FileImageOutlined /> MD Image Localizer
        </h1>
      </header>
      
      <Content className="p-6 max-w-6xl mx-auto w-full">
        <div className="mb-6 slide-up">
          <div className={`upload-container ${!content ? 'pulse' : ''}`}>
            <Dragger
              accept=".md"
              beforeUpload={handleFileUpload}
              showUploadList={false}
            >
              <p className="upload-icon">
                <InboxOutlined />
              </p>
              <p className="upload-text">Click or drag Markdown file to upload</p>
              <p className="upload-hint">
                Supports single Markdown file upload. External images will be downloaded locally.
              </p>
            </Dragger>
          </div>
        </div>

        {content && (
          <div className="mb-4 slide-up" style={{ animationDelay: '0.1s' }}>
            <Space className="mb-4">
              <Button 
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleProcess}
                loading={processing}
                className="action-button primary"
              >
                {processing ? 'Processing...' : 'Process Images'}
              </Button>
              
              {fileName && (
                <span className="text-gray-500 ml-2">
                  Current file: {fileName}
                </span>
              )}
            </Space>
            
            {processing && (
              <div className="mt-4 mb-6 fade-in">
                <Progress 
                  percent={processProgress} 
                  status={processProgress === 100 ? "success" : "active"}
                  strokeColor={{
                    from: '#108ee9',
                    to: '#87d068',
                  }}
                />
              </div>
            )}
          </div>
        )}
        
        {content && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="card-container">
              <div className="card-title">
                <FileImageOutlined /> Original Content
              </div>
              <div className="editor-container">
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </div>

            <div className="card-container">
              <div className="card-title">
                <FileDoneOutlined /> Processing Results
              </div>
              <div className="card-content">
                {result ? (
                  <div className="fade-in">
                    <div className="stats-container">
                      <div className="stat-item">
                        <CheckCircleOutlined className="stat-icon text-green-500" />
                        <span className="stat-title">Successfully processed:</span>
                        <span className="stat-value">{result.images.length} images</span>
                      </div>
                      
                      <div className="stat-item">
                        <WarningOutlined className="stat-icon text-amber-500" />
                        <span className="stat-title">Failed:</span>
                        <span className="stat-value">{result.errors.length} images</span>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">Error messages:</h3>
                        <div className="max-h-32 overflow-y-auto">
                          {result.errors.map((error, index) => (
                            <div key={index} className="error-item">
                              <div className="font-medium truncate">{error.url}</div>
                              <div className="text-xs opacity-80">{error.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.images.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">Successfully processed:</h3>
                        <div className="max-h-32 overflow-y-auto">
                          {result.images.map((image, index) => (
                            <div key={index} className="success-item">
                              <div className="font-medium truncate">{image.originalUrl}</div>
                              <div className="text-xs">→ {image.localPath}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center mt-4">
                      <Button 
                        type="primary"
                        icon={<DownloadOutlined />}
                        size="large"
                        className="action-button secondary"
                        onClick={() => {
                          const blob = new Blob([result.mdContent], { type: 'text/markdown' });
                          saveAs(blob, fileName.replace(/\.md$/, '') + '-processed.md');
                        }}
                      >
                        Download Processed MD File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <Result
                      icon={<FileImageOutlined style={{ color: '#1677ff' }} />}
                      title="Waiting for Processing"
                      subTitle="Please upload a file and click the process button"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
} 