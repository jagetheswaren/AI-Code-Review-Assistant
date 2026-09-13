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
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Run]
Filename: "{app}\install-windows.bat"; Description: "Download Required Dependencies (Python/Node) - May take a few minutes"; Flags: postinstall shellexec waituntilterminated
