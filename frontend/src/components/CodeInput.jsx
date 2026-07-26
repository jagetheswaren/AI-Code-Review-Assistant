import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CodeInput = ({ onAnalyze, disabled }) => {
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('code.py');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('editor'); // 'editor' or 'file'
  const { user } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.py')) {
        setError('Only Python files (.py) are supported');
        return;
      }
      setError('');
      setFile(selectedFile);
      setFilename(selectedFile.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target.result);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter code or upload a file');
      return;
    }
    if (user) {
      onAnalyze({ code, filename });
    } else {
      // For demo, allow anonymous analysis
      onAnalyze({ code, filename });
    }
  };

  return (
    <div className="code-input-container">
      <div className="tabs">
        <button 
          type="button"
          className={tab === 'editor' ? 'active' : ''}
          onClick={() => setTab('editor')}
        >
          Code Editor
        </button>
        <button 
          type="button"
          className={tab === 'file' ? 'active' : ''}
          onClick={() => setTab('file')}
        >
          Upload File
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {tab === 'editor' && (
          <div className="editor-section">
            <div className="filename-input">
              <label>Filename: </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="example.py"
              />
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your Python code here..."
              className="code-editor"
              spellCheck={false}
              disabled={disabled}
              rows={20}
            />
          </div>
        )}

        {tab === 'file' && (
          <div className="file-section">
            <input
              type="file"
              accept=".py"
              onChange={handleFileChange}
              disabled={disabled}
            />
            {file && (
              <div className="file-info">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-editor"
              spellCheck={false}
              disabled={true}
              rows={10}
            />
          </div>
        )}

        <button 
          type="submit" 
          className="analyze-button"
          disabled={disabled || !code.trim()}
        >
          {disabled ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </form>
    </div>
  );
};

export default CodeInput;
