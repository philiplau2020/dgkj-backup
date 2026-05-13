$keyPath = "$env:USERPROFILE\.ssh\id_rsa_dgkj"
$process = Start-Process -FilePath "ssh-keygen.exe" -ArgumentList "-t","rsa","-b","4096","-C","dgkj-deploy","-f",$keyPath,"-N",""" -NoNewWindow -Wait -PassThru
exit $process.ExitCode
