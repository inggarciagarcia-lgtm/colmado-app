import struct, base64, os, zipfile, shutil

print("1. Preparando archivos standalone de produccion...")

# 1.1 Copiar .next/static a .next/standalone/.next/static
static_src = ".next/static"
static_dst = ".next/standalone/.next/static"
if os.path.exists(static_dst):
    shutil.rmtree(static_dst)
shutil.copytree(static_src, static_dst)
print("   ✓ .next/static copiado")

# 1.2 Copiar public a .next/standalone/public (excluyendo archivos pesados .zip y .exe)
pub_src = "public"
pub_dst = ".next/standalone/public"
if os.path.exists(pub_dst):
    shutil.rmtree(pub_dst)
os.makedirs(pub_dst, exist_ok=True)
for item in os.listdir(pub_src):
    if item.endswith('.exe') or item.endswith('.zip'):
        continue
    s = os.path.join(pub_src, item)
    d = os.path.join(pub_dst, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)
print("   ✓ public copiado (sin archivos binarios redundantes)")

# 1.3 Copiar prisma y base de datos con los datos del colmado
prisma_src = "prisma"
prisma_dst = ".next/standalone/prisma"
if os.path.exists(prisma_dst):
    shutil.rmtree(prisma_dst)
shutil.copytree(prisma_src, prisma_dst)
print("   ✓ prisma y base de datos colmado copiados")

# 1.4 Copiar icono
shutil.copy2("public/icon.ico", ".next/standalone/icon.ico")

# 1.5 Crear script de inicio Iniciar_Gestor_Negocio.bat
bat_content = """@echo off
title Gestor Negocio - Libreta de Colmado y Cuentas por Cobrar
cd /d "%~dp0"
set PORT=3000
set HOSTNAME=0.0.0.0
echo =======================================================
echo   GESTOR DE NEGOCIO - LIBRETA DE FIADO Y COLMADO
echo =======================================================
echo   Iniciando servidor local...
echo   Abriendo Libreta de Cuentas por Cobrar en su navegador...
start "" "http://localhost:3000/fiao"
node server.js
pause
"""
with open(".next/standalone/Iniciar_Gestor_Negocio.bat", "w", encoding="utf-8") as f:
    f.write(bat_content)
print("   ✓ Iniciar_Gestor_Negocio.bat creado")

print("2. Empaquetando carpeta standalone en ZIP comprimido...")
zip_path = "public/Gestor_Negocio_Windows.zip"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for root, dirs, files in os.walk('.next/standalone'):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, '.next/standalone')
            z.write(full_path, os.path.join('Gestor_Negocio_Windows', rel_path))

with open(zip_path, 'rb') as f:
    zip_bytes = f.read()

size_mb = len(zip_bytes) / (1024 * 1024)
print(f"   Archivo ZIP creado: {size_mb:.1f} MB")

print("3. Generando script de instalacion de Windows...")
ps_installer = """Add-Type -A System.IO.Compression.FileSystem,System.Windows.Forms
$dir = [System.IO.Path]::Combine($env:LOCALAPPDATA, 'GestorNegocio')
if (-not [System.IO.Directory]::Exists($dir)) { [System.IO.Directory]::CreateDirectory($dir) | Out-Null }
$exe = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
try {
  $bytes = [System.IO.File]::ReadAllBytes($exe)
  $offset = -1
  for ($i = 0; $i -lt [Math]::Min($bytes.Length - 4, 32768); $i++) {
    if ($bytes[$i] -eq 0x50 -and $bytes[$i+1] -eq 0x4B -and $bytes[$i+2] -eq 0x03 -and $bytes[$i+3] -eq 0x04) {
      $offset = $i
      break
    }
  }
  if ($offset -lt 0) { throw 'Datos del instalador no encontrados.' }
  $ms = New-Object System.IO.MemoryStream($bytes, $offset, $bytes.Length - $offset)
  $z = New-Object System.IO.Compression.ZipArchive($ms)
  foreach ($e in $z.Entries) {
    $n = $e.FullName
    if ($n.StartsWith('Gestor_Negocio_Windows/')) { $n = $n.Substring(23) }
    if ([string]::IsNullOrWhiteSpace($n)) { continue }
    $t = [System.IO.Path]::Combine($dir, $n.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
    if (($n -eq 'dev.db' -or $n -eq 'prisma/dev.db') -and [System.IO.File]::Exists($t)) { continue }
    if ($e.Length -eq 0 -and ($n.EndsWith('/') -or $n.EndsWith('\\\\'))) {
      if (-not [System.IO.Directory]::Exists($t)) { [System.IO.Directory]::CreateDirectory($t) | Out-Null }
    } else {
      $p = [System.IO.Path]::GetDirectoryName($t)
      if (-not [System.IO.Directory]::Exists($p)) { [System.IO.Directory]::CreateDirectory($p) | Out-Null }
      [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $t, $true)
    }
  }
  $z.Dispose(); $ms.Dispose()
  $w = New-Object -ComObject WScript.Shell
  $ico = Join-Path $dir 'icon.ico'
  $bat = Join-Path $dir 'Iniciar_Gestor_Negocio.bat'
  foreach ($folder in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
    $s = $w.CreateShortcut((Join-Path $folder 'Gestor Negocio.lnk'))
    $s.TargetPath = $bat
    $s.WorkingDirectory = $dir
    if (Test-Path $ico) { $s.IconLocation = $ico }
    $s.Save()
  }
  [System.Windows.Forms.MessageBox]::Show('Gestor Negocio - Sistema Colmado se ha instalado exitosamente en su equipo.`n`nSe ha creado el acceso directo en su Escritorio y en su Menu Inicio.', 'Gestor Negocio - Instalacion Exitosa', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
  Start-Process -FilePath $bat -WorkingDirectory $dir
} catch {
  [System.Windows.Forms.MessageBox]::Show('Error al instalar: ' + $_.Exception.Message, 'Error de Instalacion', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
}"""

encoded_ps = base64.b64encode(ps_installer.encode('utf-16le')).decode('ascii')
cmd_str = f"powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand {encoded_ps}\x00".encode('ascii')

print("4. Compilando ejecutable PE64 nativo para Windows...")
dos_header = bytearray(64)
dos_header[0:2] = b'MZ'
dos_header[0x3C:0x40] = struct.pack('<I', 0x80)

dos_stub = b'\x0e\x1f\xba\x0e\x00\xb4\x09\xcd\x21\xb8\x01\x4c\xcd\x21This program cannot be run in DOS mode.\r\r\n$\x00\x00\x00\x00\x00\x00\x00'.ljust(64, b'\x00')
pe_sig = b'PE\x00\x00'
coff_header = struct.pack('<HHIIIHH', 0x8664, 2, 0x66E50000, 0, 0, 240, 0x0022)

file_align = 0x200
sec_align = 0x1000
image_base = 0x140000000

# .rdata
iat = struct.pack('<QQQ', 0x2058, 0x2064, 0)
ilt = struct.pack('<QQQ', 0x2058, 0x2064, 0)
idt = struct.pack('<IIIII', 0x2018, 0, 0, 0x2074, 0x2000) + (b'\x00' * 20)
hn_winexec = b'\x00\x00WinExec\x00'
hn_exitproc = b'\x00\x00ExitProcess\x00\x00'
dll_name = b'KERNEL32.dll\x00\x00'

rdata_bytes = bytearray()
rdata_bytes.extend(iat)
rdata_bytes.extend(ilt)
rdata_bytes.extend(idt)
rdata_bytes.extend(hn_winexec)
rdata_bytes.extend(hn_exitproc)
rdata_bytes.extend(dll_name)
while len(rdata_bytes) % 8 != 0:
    rdata_bytes.append(0)
cmd_str_rva = 0x2000 + len(rdata_bytes)
rdata_bytes.extend(cmd_str)
while len(rdata_bytes) % file_align != 0:
    rdata_bytes.append(0)

# .text
code = bytearray()
code.extend(b'\x48\x83\xec\x28') # sub rsp, 0x28
disp_cmd = cmd_str_rva - (0x1004 + 7)
code.extend(b'\x48\x8d\x0d' + struct.pack('<i', disp_cmd)) # lea rcx, [cmd]
code.extend(b'\xba\x00\x00\x00\x00') # mov edx, 0 (SW_HIDE)
disp_winexec = 0x2000 - (0x1010 + 6)
code.extend(b'\xff\x15' + struct.pack('<i', disp_winexec)) # call WinExec
code.extend(b'\x31\xc9') # xor ecx, ecx
disp_exitproc = 0x2008 - (0x1018 + 6)
code.extend(b'\xff\x15' + struct.pack('<i', disp_exitproc)) # call ExitProcess

while len(code) % file_align != 0:
    code.append(0xcc)

opt_header = bytearray(240)
opt_header[0:4] = struct.pack('<HBB', 0x020B, 14, 0)
opt_header[4:8] = struct.pack('<I', len(code))
opt_header[8:12] = struct.pack('<I', len(rdata_bytes))
opt_header[16:20] = struct.pack('<I', 0x1000)
opt_header[20:24] = struct.pack('<I', 0x1000)
opt_header[24:32] = struct.pack('<Q', image_base)
opt_header[32:36] = struct.pack('<I', sec_align)
opt_header[36:40] = struct.pack('<I', file_align)
opt_header[40:48] = struct.pack('<HHHH', 6, 0, 0, 0)
opt_header[48:56] = struct.pack('<HHII', 6, 0, 0, 0x1000 + len(code) + sec_align)
opt_header[56:60] = struct.pack('<I', 0x400)
opt_header[68:70] = struct.pack('<H', 2) # GUI
opt_header[70:72] = struct.pack('<H', 0x8160)
opt_header[72:88] = struct.pack('<QQQQ', 0x100000, 0x1000, 0x100000, 0x1000)
opt_header[108:112] = struct.pack('<I', 16)
opt_header[112 + 8*1 : 112 + 8*1 + 8] = struct.pack('<II', 0x2030, 40)
opt_header[112 + 8*12 : 112 + 8*12 + 8] = struct.pack('<II', 0x2000, 24)

sec1 = struct.pack('<8sIIIIIIHHI', b'.text\x00\x00\x00', len(code), 0x1000, len(code), 0x400, 0, 0, 0, 0, 0x60000020)
sec2 = struct.pack('<8sIIIIIIHHI', b'.rdata\x00\x00', len(rdata_bytes), 0x2000, len(rdata_bytes), 0x400 + len(code), 0, 0, 0, 0, 0x40000040)

headers = (dos_header + dos_stub + pe_sig + coff_header + opt_header + sec1 + sec2).ljust(0x400, b'\x00')
pe_exe = headers + code + rdata_bytes

full_installer = pe_exe + zip_bytes

exe_public = "public/Instalador_Gestor_Negocio.exe"
exe_brain = "/Users/mrgarciag/.gemini/antigravity/brain/d82088b4-fed1-470a-8783-d6fac5666818/Instalador_Gestor_Negocio.exe"

with open(exe_public, 'wb') as f:
    f.write(full_installer)

with open(exe_brain, 'wb') as f:
    f.write(full_installer)

total_mb = len(full_installer) / (1024 * 1024)
print(f"5. INSTALADOR FINALIZADO CON EXITO!")
print(f"   Archivo generado: {exe_public} ({total_mb:.1f} MB)")
print(f"   Copia en Brain: {exe_brain}")
