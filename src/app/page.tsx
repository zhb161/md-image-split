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
      message.success(`${file.name} 上传成功`);
      return false;
    } catch (error) {
      message.error('文件读取失败');
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
      message.warning('请先上传Markdown文件');
      return;
    }

    setProcessing(true);
    setProcessProgress(0);
    
    // 模拟进度条
    const clearProgressSimulation = simulateProgress();
    
    try {
      const processResult = await processMarkdown(content);
      setResult(processResult);
      setProcessProgress(100);
      message.success('处理完成');
    } catch (error) {
      message.error('处理失败');
    } finally {
      clearProgressSimulation();
      setProcessing(false);
    }
  };

  return (
    <Layout className="min-h-screen">
      <header className="site-header">
        <h1>
          <FileImageOutlined /> MD图片本地化工具
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
              <p className="upload-text">点击或拖拽上传Markdown文件</p>
              <p className="upload-hint">
                支持单个Markdown文件上传，文件中的外部图片将被下载到本地
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
                {processing ? '处理中...' : '处理图片'}
              </Button>
              
              {fileName && (
                <span className="text-gray-500 ml-2">
                  当前文件: {fileName}
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
                <FileImageOutlined /> 原始内容
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
                <FileDoneOutlined /> 处理结果
              </div>
              <div className="card-content">
                {result ? (
                  <div className="fade-in">
                    <div className="stats-container">
                      <div className="stat-item">
                        <CheckCircleOutlined className="stat-icon text-green-500" />
                        <span className="stat-title">成功处理图片:</span>
                        <span className="stat-value">{result.images.length} 张</span>
                      </div>
                      
                      <div className="stat-item">
                        <WarningOutlined className="stat-icon text-amber-500" />
                        <span className="stat-title">处理失败:</span>
                        <span className="stat-value">{result.errors.length} 张</span>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">错误信息:</h3>
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
                        <h3 className="font-semibold mb-2">成功处理:</h3>
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
                        下载处理后的MD文件
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <Result
                      icon={<FileImageOutlined style={{ color: '#1677ff' }} />}
                      title="等待处理"
                      subTitle="请先上传文件并点击处理按钮"
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