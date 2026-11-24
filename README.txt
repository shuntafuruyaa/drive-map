ドライブマップ（PWA版）

このフォルダの中身をそのままWebに置くと、スマホのホーム画面に追加して使え、圏外でも地図とピンを見られます。

■ GitHub Pagesで公開する手順（無料）
1. GitHub にログイン →「New repository」で新しいリポジトリを作成（例：drive-map、Public）
2. 「uploading an existing file」から、このフォルダの中身（index.html / sw.js / manifest.webmanifest / icons フォルダ）をドラッグしてアップロード →「Commit changes」
3. リポジトリの Settings → Pages → Branch を「main」「/(root)」にして Save
4. 1〜2分後に表示される https://ユーザー名.github.io/drive-map/ がアプリのURLです

■ ホーム画面に追加
- Android（Chrome）：アプリの「共有・保存」タブ →「ホーム画面に追加する」
- iPhone（Safari）：共有ボタン →「ホーム画面に追加」
  ※ iPhoneはSafariとホーム画面アプリでデータが別々です。「引き継ぎコード」で移してください。

■ 更新するとき
index.html などを上書きアップロードし、sw.js の先頭付近の VERSION を 1.3.2 のように上げてください。
次に開いたとき「新しいバージョンがあります」と出ます。
