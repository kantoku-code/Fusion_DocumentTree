# Fusion360API Python Addin
import adsk.core
import adsk.fusion
import time
from ... import config


class DataFileContainer:
    def __init__(self):
        self.treeJson = None
        self.datas = {}
        self.idNumber = 0
        self._last_do_events_time = 0


    def load(self):
        """
        データの取得
        """
        app: adsk.core.Application = adsk.core.Application.get()

        self.treeJson = None
        self.datas = {}
        self.idNumber = 0

        msg = self.__checkExec__()
        if len(msg) > 0:
            self.treeJson = {
                "id": -1,
                "text": msg,
                "icon": "fas fa-exclamation-triangle",
            }
            return

        dataFile: adsk.core.DataFile = app.activeDocument.dataFile
        roots = self.__getRootDataFiles__(dataFile)

        # トップレベル毎に関連ファイルの取得
        lst = [self.__getAllChildrenReferences__(df) for df in roots]

        # print(f"len(lst): {len(lst)}")
        if len(lst) < 1:
            return

        if not lst[0]:
            return

        infos = []
        for idx, info in enumerate(lst):
            id = info["id"]
            df: adsk.core.DataFile = self.datas[id]
            if not df:
                continue

            infos.append(
                {
                    "id": (idx + 1) * -1,
                    "text": config.MESSAGES["ProjectNamePrefix"].format(df.parentProject.name),
                    "icon": "fab fa-fort-awesome",
                    "thumbnail": df.thumbnail.dataObject.getAsBase64String(),
                    "children": [info],
                }
            )

        self.treeJson = infos


    def __checkExec__(self) -> str:
        """
        実行チェック
        
        :return: エラーメッセージ
        :rtype: str
        """
        app: adsk.core.Application = adsk.core.Application.get()

        # オフラインチェック
        if app.isOffLine:
            return config.MESSAGES["OfflineError"]

        # datafileチェック
        actData: adsk.core.DataFile = app.activeDocument.dataFile
        if not actData:
            return config.MESSAGES["NoDataError"]

        return ""


    def __getAllChildrenReferences__(
                self, dataFile: adsk.core.DataFile) -> list:
        """
        全関連datafile取得
        
        :param dataFile: 対象データファイル
        :type dataFile: adsk.core.DataFile
        :return: 全関連datafileリスト
        :rtype: list
        """
        # 対象拡張子
        targetFileExtension = [
            "f3d",
        ]
        drawFileExtension = [
            "f2d",
        ]

        # サポート関数
        def getHasDrawDataFile(datafile: adsk.core.DataFile) -> list:
            if not datafile.hasParentReferences:
                return []

            return [
                d
                for d in datafile.parentReferences.asArray()
                if d.fileExtension in drawFileExtension
            ]

        def getHasChildrenDataFile(datafile: adsk.core.DataFile) -> list:
            if not datafile.hasChildReferences:
                return []

            return [
                d
                for d in datafile.childReferences.asArray()
                if d.fileExtension in targetFileExtension
            ]

        def initDataDict(datafile: adsk.core.DataFile):
            self._doEventsIfNeeded()

            self.idNumber += 1
            id = self.idNumber
            self.datas[id] = datafile

            ext = datafile.fileExtension

            # https://fontawesome.com/v5.15/icons?d=gallery&p=2
            icon = "fas fa-file"
            if len(ext) > 0:
                ext = "." + ext

                if ext == ".f3d":
                    icon = "fas fa-dice-d6"
                elif ext == ".f2d":
                    icon = "fas fa-drafting-compass"

            # エラー対策
            thumbnail: str = ""
            try:
                thumbnail = datafile.thumbnail.dataObject.getAsBase64String()
            except Exception:
                thumbnail = ""

            return {
                "id": id,
                "text": self._get_data_file_fullname(datafile),
                "tooltip": self._get_tooltip_comment(datafile),
                "icon": icon,
                "thumbnail": thumbnail,
                "children": [],
            }

        def getChildrenReferences(dataDict, datafile):
            # 2d
            draws = getHasDrawDataFile(datafile)
            dataDict["children"] = [initDataDict(d) for d in draws]

            # 3d
            children = getHasChildrenDataFile(datafile)
            if len(children) < 1:
                return

            dictLst = [initDataDict(d) for d in children]
            dataDict["children"].extend(dictLst)

            for dict, child in zip(dictLst, children):
                getChildrenReferences(dict, child)

            return dataDict

        # *********
        if not dataFile:
            return []

        self._doEventsIfNeeded()
        return getChildrenReferences(initDataDict(dataFile), dataFile)


    def __getRootDataFiles__(
        self,
        datafile: adsk.core.DataFile,
    ) -> list:
        """
        topデータファイルを取得
        
        :param datafile: 対象データファイル
        :type datafile: adsk.core.DataFile
        :return: topデータファイルリスト
        :rtype: list
        """
        # 対象拡張子
        targetFileExtension = [
            "f3d",
        ]

        # サポート関数
        def getHasParentDataFile(datafile: adsk.core.DataFile) -> list:
            if not datafile.hasParentReferences:
                return []

            return getHasExtensionDataFile(datafile, targetFileExtension)

        def getHasExtensionDataFile(
            datafile: adsk.core.DataFile, extensionLst: list
        ) -> list:
            if not datafile.hasParentReferences:
                return []

            return [
                d
                for d in datafile.parentReferences.asArray()
                if d.fileExtension in extensionLst
            ]

        # *********
        if not datafile:
            return []

        checkDatas: list = [datafile]

        rootDatas: list = []
        df: adsk.core.DataFile
        while len(checkDatas) > 0:
            self._doEventsIfNeeded()
            hasParentDatas: list = []
            for df in checkDatas:
                # 3d
                parents: list = getHasParentDataFile(df)
                if len(parents) < 1:
                    rootDatas.append(df)
                else:
                    hasParentDatas.extend(parents)

            if len(hasParentDatas) > 0:
                checkDatas = hasParentDatas
            else:
                checkDatas = []

        return rootDatas


    def getJson(self) -> list:
        """
        JSON用リストを取得
        
        :return: JSON用リスト
        :rtype: list
        """
        return self.treeJson


    def getDataFile(self, id: int) -> adsk.core.DataFile:
        """
        IDからデータファイルを取得
        
        :param id: データファイルID
        :type id: int
        :return: データファイル
        :rtype: adsk.core.DataFile
        """
        if id not in self.datas:
            return None

        return self.datas[id]


    def _get_tooltip_comment(self, datafile: adsk.core.DataFile) -> str:
        """
        ノードのツールチップに表示するファイル情報の取得
        
        :param datafile: 対象データファイル
        :type datafile: adsk.core.DataFile
        :return: データファイル情報
        :rtype: str
        """

        displyName: str
        try:
            displyName = datafile.createdBy.displayName
        except Exception:
            displyName = config.MESSAGES["UnknownUser"]

        msg = [
            f"FileName: {self._get_data_file_fullname(datafile)}  Version: {datafile.versionNumber}",
            f"User: {displyName}",
            f"{datafile.description}",
        ]
        return "\n".join(msg)


    def _get_data_file_fullname(self, datafile: adsk.core.DataFile) -> str:
        """
        拡張子付きファイル名取得
        
        :param datafile: 対象データファイル
        :type datafile: adsk.core.DataFile
        :return: 拡張子付きファイル名
        :rtype: str
        """
        return f"{datafile.name}.{datafile.fileExtension}"

    def _doEventsIfNeeded(self):
        """
        適度にadsk.doEvents()を呼び出す (0.1秒間隔)
        """
        t = time.time()
        if t - self._last_do_events_time > 0.1:
            adsk.doEvents()
            self._last_do_events_time = t
