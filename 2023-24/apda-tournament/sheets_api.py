import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from apda_tournament import utils


def authorize():
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    creds = None
    if os.path.exists("data/token.json"):
        creds = Credentials.from_authorized_user_file(
            "data/token.json",
            scopes
        )
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "data/credentials.json",
                scopes
            )
            creds = flow.run_local_server(port=0)
        with open("data/token.json", "w") as token:
            token.write(creds.to_json())
    return creds


def service():
    service = build("sheets", "v4", credentials=authorize())
    return service.spreadsheets()


def extract_data(sheet_id, range_name):
    try:
        sheet = service()
        values = sheet.values().get(spreadsheetId=sheet_id, range=range_name)
        return values.execute().get("values", [])
    except HttpError as error:
        print(error)


def download_backtab():
    spreadsheet_id = "1ZC_-c5k0jzIJVyPtGUSBivcrWKUB_IazwYb7EzyCYHk"
    range_name = "backtab entry!A1:AG64"
    data = extract_data(spreadsheet_id, range_name)
    rows = [dict(zip(data[0], row)) for row in data[1:]]
    utils.data("backtab", extension="csv", data=rows)


def download_judges():
    spreadsheet_id = "12UuLaorsf13aqUAnZav6XIiuhT5pPWZo1u48gaNxGs4"
    range_name = "Sheet1!A1:D100"
    data = extract_data(spreadsheet_id, range_name)
    rows = [dict(zip(data[0], row)) for row in data[1:]]
    utils.data("judges", extension="csv", data=rows)
