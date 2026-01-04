import json
import os
import traceback

import adsk.core

from ... import config
from ...lib import fusionAddInUtils as futil
from .DataFileContainer import DataFileContainer

app = adsk.core.Application.get()
ui = app.userInterface

# TODO ********************* Change these names *********************
CMD_ID = f"{config.COMPANY_NAME}_{config.ADDIN_NAME}_DocumentTree"
CMD_NAME = config.CMD_NAME
CMD_Description = config.CMD_Description
PALETTE_NAME = config.PALETTE_NAME
IS_PROMOTED = True

# Using "global" variables by referencing values from /config.py
PALETTE_ID = config.sample_palette_id

# Specify the full path to the local html. You can also use a web URL
# such as 'https://www.autodesk.com/'
PALETTE_URL = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "resources", "html", "index.html"
)

# The path function builds a valid OS path. This fixes it to be a valid local URL.
PALETTE_URL = PALETTE_URL.replace("\\", "/")

# Set a default docking behavior for the palette
PALETTE_DOCKING = adsk.core.PaletteDockingStates.PaletteDockStateRight

# TODO *** Define the location where the command button will be created. ***
# This is done by specifying the workspace, the tab, and the panel, and the
# command it will be inserted beside. Not providing the command to position it
# will insert it at the end.
WORKSPACE_ID = config.WORKSPACE_ID
TAB_ID = config.TAB_ID
TAB_NAME = config.TAB_NAME
PANEL_ID = config.PANEL_ID
PANEL_NAME = config.PANEL_NAME
PANEL_AFTER = config.PANEL_AFTER

COMMAND_BESIDE_ID = ""


# Resource location for command icons, here we assume a sub folder in this directory named "resources".
ICON_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resources", "")

# Local list of event handlers used to maintain a reference so
# they are not released and garbage collected.
local_handlers = []

_dataContainer = None
_myCustomEventId = "MyCustomEventId"
_customEvent: adsk.core.CustomEvent = None
_customEventHandler: adsk.core.CustomEventHandler = None
palette_handlers = []


# Executed when add-in is run.
def start():
    # コマンドの定義を作成する。
    cmd_def = ui.commandDefinitions.addButtonDefinition(
        CMD_ID, CMD_NAME, CMD_Description, ICON_FOLDER
    )

    # コマンド作成イベントのイベントハンドラを定義します。
    # このハンドラは、ボタンがクリックされたときに呼び出されます。
    futil.add_handler(cmd_def.commandCreated, command_created)

    # ******** ユーザーがコマンドを実行できるように、UIにボタンを追加します。 ********
    # ボタンが作成される対象のワークスペースを取得します。
    workspace = ui.workspaces.itemById(WORKSPACE_ID)

    toolbar_tab = workspace.toolbarTabs.itemById(TAB_ID)
    if toolbar_tab is None:
        toolbar_tab = workspace.toolbarTabs.add(TAB_ID, TAB_NAME)

    # ボタンが作成されるパネルを取得します。
    panel = workspace.toolbarPanels.itemById(PANEL_ID)
    if panel is None:
        panel = toolbar_tab.toolbarPanels.add(PANEL_ID, PANEL_NAME, PANEL_AFTER, False)

    # 指定された既存のコマンドの後に、UI のボタンコマンド制御を作成します。
    control = panel.controls.addCommand(cmd_def, COMMAND_BESIDE_ID, False)

    # コマンドをメインツールバーに昇格させるかどうかを指定します。
    control.isPromoted = IS_PROMOTED

    # CustomEventの登録
    global _myCustomEventId, _customEvent, _customEventHandler
    try:
        futil.app.unregisterCustomEvent(_myCustomEventId)
    except Exception:
        pass
    _customEvent = futil.app.registerCustomEvent(_myCustomEventId)
    _customEventHandler = MyCustomEventHandle()
    _customEvent.add(_customEventHandler)


# Executed when add-in is stopped.
def stop():
    # Get the various UI elements for this command
    workspace = ui.workspaces.itemById(WORKSPACE_ID)
    panel = workspace.toolbarPanels.itemById(PANEL_ID)
    command_control = panel.controls.itemById(CMD_ID)
    command_definition = ui.commandDefinitions.itemById(CMD_ID)
    palette = ui.palettes.itemById(PALETTE_ID)

    # Delete the button command control
    if command_control:
        command_control.deleteMe()

    # Delete the command definition
    if command_definition:
        command_definition.deleteMe()

    # Delete the Palette
    if palette:
        palette.deleteMe()

    # Unregister CustomEvent
    global _myCustomEventId
    futil.app.unregisterCustomEvent(_myCustomEventId)

    global _customEventHandler
    _customEventHandler = None

    global palette_handlers
    palette_handlers = []


def command_created(args: adsk.core.CommandCreatedEventArgs):
    futil.log(f"{CMD_NAME}: Command created event.")

    futil.add_handler(
        args.command.execute, command_execute, local_handlers=local_handlers
    )
    futil.add_handler(
        args.command.destroy, command_destroy, local_handlers=local_handlers
    )


def command_execute(args: adsk.core.CommandEventArgs):
    # General logging for debug.
    futil.log(f"{CMD_NAME}: {args.firingEvent.name}")

    palettes = ui.palettes
    palette = palettes.itemById(PALETTE_ID)

    if palette:
        palette.deleteMe()

    palette = palettes.add(
        id=PALETTE_ID,
        name=PALETTE_NAME,
        htmlFileURL=PALETTE_URL,
        isVisible=True,
        showCloseButton=True,
        isResizable=True,
        width=400,
        height=300,
        useNewWebBrowser=True,
    )
    palette.isVisible = True

    global palette_handlers
    palette_handlers = []
    futil.add_handler(palette.closed, palette_closed, local_handlers=palette_handlers)
    futil.add_handler(palette.navigatingURL, palette_navigating, local_handlers=palette_handlers)
    futil.add_handler(palette.incomingFromHTML, palette_incoming, local_handlers=palette_handlers)

    eventArgs = {"Value": 1}
    app.fireCustomEvent(_myCustomEventId, json.dumps(eventArgs))


def palette_closed(args: adsk.core.UserInterfaceGeneralEventArgs):
    futil.log(f"{CMD_NAME}: {args.firingEvent.name}")
    global palette_handlers
    palette_handlers = []


def palette_navigating(args: adsk.core.NavigationEventArgs):
    futil.log(f"{CMD_NAME}: {args.firingEvent.name}")


def palette_incoming(html_args: adsk.core.HTMLEventArgs):
    futil.log(f"{CMD_NAME}: {html_args.firingEvent.name}")

    global _dataContainer
    try:
        if html_args.action == "htmlLoaded":
            futil.log(f"{CMD_NAME}: htmlLoaded received.")
            # 起動時
            _dataContainer = DataFileContainer()
            
            # データを非同期で取得するためにCustomEventを発火
            eventArgs = {"action": "loadData"}
            app.fireCustomEvent(_myCustomEventId, json.dumps(eventArgs))

            html_args.returnData = json.dumps(
                {
                    "action": "loading",
                    "data": [],
                }
            )

        elif html_args.action == "open_active":
            # オープン時
            data = json.loads(html_args.data)

            datafile: adsk.core.DataFile = _dataContainer.getDataFile(int(data["id"]))

            if not datafile:
                return

            execOpenDataFiles([datafile])
    except:
        futil.log("Failed:\n{}".format(traceback.format_exc()))
        html_args.returnData = json.dumps(
            {
                "action": "send",
                "data": {
                    "id": -1,
                    "text": f"Error: {traceback.format_exc()}",
                    "icon": "fas fa-exclamation-triangle",
                },
            }
        )


def command_destroy(args: adsk.core.CommandEventArgs):
    futil.log(f"{CMD_NAME}: {args.firingEvent.name}")

    global local_handlers
    local_handlers = []


class MyCustomEventHandle(adsk.core.CustomEventHandler):
    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            futil.log(f"{CMD_NAME}: {args.firingEvent.name}")
            
            if not args.additionalInfo:
                return

            eventArgs = json.loads(args.additionalInfo)
            if eventArgs.get("action") == "loadData":
                futil.log("Start loading data...")

                global _dataContainer
                container = _dataContainer
                if container:
                    container.load()
                    jstreeJson = container.getJson()
                    
                    palette = ui.palettes.itemById(PALETTE_ID)
                    if palette:
                         palette.sendInfoToHTML("send", json.dumps({"data": jstreeJson}))
                         futil.log("Data sent to palette.")

            futil.log(f"Custom Event Info: {args.additionalInfo}")
        except Exception:
            futil.log("Failed:\n{}".format(traceback.format_exc()))


# ファイルを開く
def execOpenDataFiles(dataFiles: list):
    docs: adsk.core.Documents = futil.app.documents

    def getDocFromDatafileId(id) -> adsk.fusion.FusionDocument:
        for d in docs:
            if not d.dataFile:
                continue

            if d.dataFile.id == id:
                return d
        return None

    df: adsk.core.DataFile
    df: adsk.core.DataFile
    try:
        for df in dataFiles:
            doc: adsk.fusion.FusionDocument = getDocFromDatafileId(df.id)
            adsk.doEvents()
            if doc:
                futil.log(f"{CMD_NAME}: call doc.activate")
                doc.activate()
            else:
                futil.log(f"{CMD_NAME}: call doc.open")
                docs.open(df)
    except Exception:
        futil.log("execOpenDataFiles Failed:\n{}".format(traceback.format_exc()))
