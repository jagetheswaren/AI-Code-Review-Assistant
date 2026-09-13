[Setup]
AppName=IntelliReview AI
AppVersion=1.0.0
AppPublisher=Jagetheswaren
DefaultDirName={localappdata}\Programs\IntelliReviewAI
DefaultGroupName=IntelliReview AI
OutputDir=..\dist
OutputBaseFilename=IntelliReview-AI-Setup
SetupIconFile=IntelliReviewAI.ico
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest
UninstallDisplayIcon={app}\installer\IntelliReviewAI.ico

[Files]
Source: "..\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*,venv\*,.git\*,dist\*,installer\*.exe,IntelliReview-v1.0.zip"

[Icons]
Name: "{group}\IntelliReview AI"; Filename: "{app}\Start-IntelliReview.bat"; IconFilename: "{app}\installer\IntelliReviewAI.ico"
Name: "{autodesktop}\IntelliReview AI"; Filename: "{app}\Start-IntelliReview.bat"; IconFilename: "{app}\installer\IntelliReviewAI.ico"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Run]
Filename: "{app}\install-windows.bat"; Parameters: "--silent"; Description: "Setting up local Python and Node.js environments (This may take a few minutes)..."; Flags: postinstall waituntilterminated
Filename: "{app}\Start-IntelliReview.bat"; Description: "Launch IntelliReview AI now"; Flags: postinstall shellexec skipifsilent unchecked

[Code]
function CheckCommandExists(Command: String): Boolean;
var
  ResultCode: Integer;
begin
  Exec('cmd.exe', '/c where ' + Command, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := (ResultCode = 0);
end;

function InitializeSetup(): Boolean;
var
  MissingDeps: String;
begin
  Result := True;
  MissingDeps := '';

  if not CheckCommandExists('python') then
    MissingDeps := MissingDeps + ' - Python 3.11+ (Ensure "Add python.exe to PATH" is checked)' + #13#10;
  
  if not CheckCommandExists('node') then
    MissingDeps := MissingDeps + ' - Node.js 18+' + #13#10;
    
  if not CheckCommandExists('docker') then
    MissingDeps := MissingDeps + ' - Docker Desktop' + #13#10;
    
  if not CheckCommandExists('ollama') then
    MissingDeps := MissingDeps + ' - Ollama' + #13#10;

  if MissingDeps <> '' then
  begin
    MsgBox('IntelliReview AI requires the following external tools to run locally:' + #13#10#13#10 + 
           MissingDeps + #13#10 + 
           'Please install them and ensure they are added to your system PATH, then run this installer again.' + #13#10 +
           'See https://github.com/jagetheswaren/AI-Code-Review-Assistant for download links.', 
           mbError, MB_OK);
    Result := False;
  end;
end;
