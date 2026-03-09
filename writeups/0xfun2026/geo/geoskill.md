# osint/0xfunCTF 2026: GeoSkill (日本語版)
2025年12月9日 |

はい、このCTFは最初から完全に大惨事でした。問題の盗作、貧弱なインフラ、文字通り起こりうる最悪の事態がすべて起こりました。
しかし、このCTFで唯一の救いだったのは、明らかに私の問題である『GeoSkill』でした。これはジオOSINT（地理的公開情報調査）のスキルとマンパワーが試されるガチなテストです。

# ロケーション 1
写真はブラジルのリオデジャネイロにある『救世主キリスト像』でした。有名なイエス像を検索するか、逆画像検索をすれば簡単に見つかります。
[https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)](https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue))
![image](https://www.acn1.xyz/images/geoskill/Location1.png)

# ロケーション 2
この場所はナイジェリアのラゴスでした。右上に銀行の名前が見えるので、それをググるだけです。
![image](https://www.acn1.xyz/images/geoskill/Location2.png)
![image](https://www.acn1.xyz/images/geoskill/Location2_1.png)

# ロケーション 3
この場所もGoogleの逆画像検索で簡単に解けます。最初の結果に「クリスマス島」と出てきます。
![image](https://www.acn1.xyz/images/geoskill/image3.png)

# ロケーション 4
ユーザーには、日本の都道府県の範囲内である可能性を示唆しました。また、Geoguessrの知識が役に立つというヒントも出しました。
想定された解法は、Geoguessrのテクニックを紹介している人気サイト「Plonk It」を使うことでした。画像の青い線を手がかりに、それが愛媛県で最も一般的なサイクリング用であることを特定するはずでした。
![image](https://www.acn1.xyz/images/geoskill/image4.png)
![image](https://www.acn1.xyz/images/geoskill/image4_2.png)

# ロケーション 5
これは最も多くの人が苦戦した問題です。多くの人が画像内の様々な物体を逆検索したり、Googleストリートビューの著作権日を使おうとしたり、あるいは全道路を総当たりしようとしたりしました。
想定解は「Googleカー」を使うことでした。Googleカーは非常に特徴的です。ストリートビューで使われている車はそれほど多くないので、いくつかの国に絞り込むことができます。
![image](https://www.acn1.xyz/images/geoskill/image5.png)

車を逆画像検索すると複数の国が出てくるかもしれませんが、想定解は既知のGoogleストリートビュー車両を網羅したサイトを使うことでした：
[https://geohints.com/meta/googleVehicles/cars](https://geohints.com/meta/googleVehicles/cars)

このサイトでは、既知のGoogleストリートビュー車両とその場所を1つずつ確認できます。「Open in Google Maps」をクリックすると、その場所に直接飛べます。
![image](https://www.acn1.xyz/images/geoskill/image5_2.png)

これは「当て推量（guessy）」だったでしょうか？ 私はインスタンスの最初に、Geoguessrのスキルとオンラインツールを使って様々なGoogleカーの場所を特定することについて一文を書いておきました。個人的には、これは当て推量ではなく、単にスキルの問題（skill issue）だと思います。

回答を求めてDiscordサーバーに参加したりRedditに投稿したりするケースがいくつかありましたが、拡散する前にすべて阻止しました。さもなければ、正解数はもっと減っていたでしょう。

回答: Kongebrovej
[https://www.google.com/maps/place/36°14’22.5”N+112°28’17.0”W/@36.0993503,-112.1110751,3a,90y,344.23h,94.66t/data=!3m7!1e1!3m5!1so7I4sgYKa9vXbpHlTkvnKw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-4.655209544171058%26panoid%3Do7I4sgYKa9vXbpHlTkvnKw%26yaw%3D344.23177835702813!7i13312!8i6656!4m4!3m3!8m2!3d36.2395804!4d-112.4713853?entry=ttu&#x26;g_ep=EgoyMDI2MDIwNC4wIKXMDSoKLDEwMDc5MjA2OUgBUAM%3D](https://www.google.com/maps/place/36%C2%B014&#x27;22.5%22N+112%C2%B028&#x27;17.0%22W/@36.0993503,-112.1110751,3a,90y,344.23h,94.66t/data=!3m7!1e1!3m5!1so7I4sgYKa9vXbpHlTkvnKw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-4.655209544171058%26panoid%3Do7I4sgYKa9vXbpHlTkvnKw%26yaw%3D344.23177835702813!7i13312!8i6656!4m4!3m3!8m2!3d36.2395804!4d-112.4713853?entry=ttu&#x26;g_ep=EgoyMDI2MDIwNC4wIKXMDSoKLDEwMDc5MjA2OUgBUAM%3D)

# ロケーション 6
#isthistheGRANDfinale（これはグランドフィナーレか？）
これはグランドキャニオン（Grand Canyon）へのヒントでした。川沿いを辿り、川の近くのあらゆる場所のストリートビューを確認すればよかったのです。

正直、なぜこれほど多くの人が苦戦したのか分かりません。「Grand Canyon」で検索したときにGoogleマップが表示する、川に最も近い場所を選んだだけなのに。
![image](https://www.acn1.xyz/images/geoskill/image6_2.png)

場所: ///sailor.cascading.mower
[https://www.google.com/maps/place/36°14’22.5”N+112°28’17.0”W/@36.0993503,-112.1110751,3a,90y,344.23h,94.66t/data=!3m7!1e1!3m5!1so7I4sgYKa9vXbpHlTkvnKw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-4.655209544171058%26panoid%3Do7I4sgYKa9vXbpHlTkvnKw%26yaw%3D344.23177835702813!7i13312!8i6656!4m4!3m3!8m2!3d36.2395804!4d-112.4713853?entry=ttu&#x26;g_ep=EgoyMDI2MDIwNC4wIKXMDSoKLDEwMDc5MjA2OUgBUAM%3D](https://www.google.com/maps/place/36%C2%B014&#x27;22.5%22N+112%C2%B028&#x27;17.0%22W/@36.0993503,-112.1110751,3a,90y,344.23h,94.66t/data=!3m7!1e1!3m5!1so7I4sgYKa9vXbpHlTkvnKw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-4.655209544171058%26panoid%3Do7I4sgYKa9vXbpHlTkvnKw%26yaw%3D344.23177835702813!7i13312!8i6656!4m4!3m3!8m2!3d36.2395804!4d-112.4713853?entry=ttu&#x26;g_ep=EgoyMDI2MDIwNC4wIKXMDSoKLDEwMDc5MjA2OUgBUAM%3D)

# ロケーション 7
本来の想定解は、以下の3つを組み合わせることでした：
- 著作権の日付
- 黒いGoogleカー
- 左側通行
- 英語圏
これでバミューダ（Bermuda）に辿り着けます。

しかし、右上の日付を消し忘れたため、非常に簡単になってしまいました。著作権の日付でフィルターをかければすぐでした。
[https://www.google.com/maps/place/32°18’57.1”N+64°45’01.7”W/@32.3159517,-64.7510602,18.75z/data=!4m4!3m3!8m2!3d32.3158645!4d-64.7504674?entry=ttu&#x26;g_ep=EgoyMDI2MDIwNC4wIKXMDSoASAFQAw%3D%3D](https://www.google.com/maps/place/32%C2%B018&#x27;57.1%22N+64%C2%B045&#x27;01.7%22W/@32.3159517,-64.7510602,18.75z/data=!4m4!3m3!8m2!3d32.3158645!4d-64.7504674?entry=ttu&#x26;g_ep=EgoyMDI2MDIwNC4wIKXMDSoASAFQAw%3D%3D)
![image](https://www.acn1.xyz/images/geoskill/image7.png)

全体として、このCTFは本当にめちゃくちゃで、起こりうるトラブルが全て起こりました。でも、あの一連の騒動を私のせいにしないでくださいね。マジ、私には責任がないですから（CTF問題を盗んだりもしていませんよ（笑））。
