/* eslint-disable react/no-unescaped-entities */
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../../components/Header";
import { useTranslation } from "react-i18next";

/**
 * SMV Segment Table component
 * Converted from static HTML to React + TypeScript (TSX)
 */
const IPDivisionTable: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ paddingTop: '70px' }}>
      <Header />
      <style>{`
        .table-container {
          overflow-x: auto;
          margin: 20px;
          max-height: calc(100vh - 150px);
          overflow-y: auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border-radius: 8px;
        }

        .ip-division-table {
          font-size: 14px;
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }
        
        .ip-division-table th {
          background-color: rgb(13, 109, 253) !important;
          color: white !important;
          text-align: center;
          vertical-align: middle !important;
          font-weight: 500;
          white-space: nowrap;
          padding: 12px 8px !important;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .ip-division-table td {
          padding: 8px !important;
          vertical-align: middle !important;
        }

        .row-yellow { 
          background-color: rgb(25, 199, 176) !important;
        }
        .row-blue { 
          background-color: rgb(25, 199, 176) !important;
        }
        .row-peach { 
          background-color: rgb(25, 199, 176) !important;
        }

        .ip-division-table tr:hover td {
          background-color: rgba(0,0,0,0.075) !important;
        }

        .table-secondary td {
          background-color: #e9ecef !important;
        }

        .ip-division-table small {
          font-size: 85%;
          color: #6c757d;
        }

        .bullet-point {
          padding-left: 15px;
          position: relative;
        }
        .bullet-point:before {
          content: "•";
          position: absolute;
          left: 0;
        }

        /* Custom scrollbar styles */
        .table-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      <div className="table-container">
        <table className="table table-bordered table-sm align-middle text-nowrap ip-division-table">
          <thead>
            <tr>
              <th rowSpan={2}>
                {t("ipDivision.table.smvSegment")}
              </th>
              <th rowSpan={2}>{t("ipDivision.table.no")}</th>
              <th rowSpan={2}>
                {t("ipDivision.table.networkAddress")}
              </th>
              <th rowSpan={2}>
                {t("ipDivision.table.subnetMask")}
              </th>
              <th rowSpan={2}>
                {t("ipDivision.table.defaultGateway")}
              </th>
              <th rowSpan={2}>{t("ipDivision.table.ipRange")}</th>
              <th rowSpan={2}>
                {t("ipDivision.table.assignableHosts")}
              </th>
              <th rowSpan={2}>{t("ipDivision.table.vlanId")}</th>
              <th rowSpan={2}>
                {t("ipDivision.table.managementL3")}
              </th>
              <th rowSpan={2}>{t("ipDivision.table.ipType")}</th>
              <th rowSpan={2}>{t("ipDivision.table.dhcpRange")}</th>
              <th rowSpan={2}>{t("ipDivision.table.use")}</th>
              <th rowSpan={2}>{t("ipDivision.table.remark")}</th>
            </tr>
          </thead>
          <tbody>
            {/* 172.25.160 – 5 rows */}
            <tr className="row-peach">
              <td rowSpan={5}>172.25.160</td>
              <td>1</td>
              <td>
                172.25.160.0/27
                <br />
                <small>{t("ipDivision.notes.reservation")}</small>
              </td>
              <td>/27 - 255.255.255.224</td>
              <td>—</td>
              <td>172.25.160.0 ~ 31</td>
              <td></td>
              <td></td>
              <td></td>
              <td>Fixed</td>
              <td></td>
              <td>For global network allocation</td>
              <td></td>
            </tr>

            <tr className="row-yellow">
              <td>2</td>
              <td>172.25.160.32/30</td>
              <td>/30 - 255.255.255.252</td>
              <td>—</td>
              <td>172.25.160.32 ~ 35</td>
              <td>2</td>
              <td>991</td>
              <td></td>
              <td>Fixed</td>
              <td></td>
              <td>Segment between L3 (OFcore ↔ FAcore)</td>
              <td></td>
            </tr>

            <tr className="row-yellow">
              <td>3</td>
              <td>172.25.160.36/30</td>
              <td>/30 - 255.255.255.252</td>
              <td>—</td>
              <td>172.25.160.36 ~ 39</td>
              <td>2</td>
              <td>992</td>
              <td></td>
              <td>Fixed</td>
              <td></td>
              <td>Segment between L3 (FAcore ↔ DPcore)</td>
              <td></td>
            </tr>

            <tr className="row-yellow">
              <td>4</td>
              <td>172.25.160.40/30</td>
              <td>/30 - 255.255.255.252</td>
              <td>—</td>
              <td>172.25.160.40 ~ 43</td>
              <td>2</td>
              <td>993</td>
              <td></td>
              <td>Fixed</td>
              <td></td>
              <td>Segment between L3 (FAcore ↔ CMcore)</td>
              <td>Add 2/9/2021</td>
            </tr>

            <tr className="row-peach">
              <td>5</td>
              <td>172.25.160.252/30</td>
              <td>/30 - 255.255.255.252</td>
              <td>—</td>
              <td>172.25.160.252 ~ 255</td>
              <td>2</td>
              <td>997</td>
              <td>Close</td>
              <td>Fixed</td>
              <td></td>
              <td>For NAS iSCSI</td>
              <td>{t("ipDivision.notes.closed")}</td>
            </tr>

            {/* 172.25.161 */}
            <tr>
              <td>172.25.161</td>
              <td>6</td>
              <td>172.25.161.0/24</td>
              <td>/24 - 255.255.255.0</td>
              <td>172.25.161.1</td>
              <td>172.25.161.0 ~ 255</td>
              <td>254</td>
              <td>161</td>
              <td>Office</td>
              <td>Fixed</td>
              <td></td>
              <td>OFFICE - NETWORK - MGMT</td>
              <td>{t("ipDivision.notes.nativeVlan")}</td>
            </tr>

            {/* 172.25.162 */}
            <tr className="row-blue">
              <td>172.25.162</td>
              <td>7</td>
              <td>172.25.162.0/24</td>
              <td>/24 - 255.255.255.0</td>
              <td>172.25.162.1</td>
              <td>172.25.162.0 ~ 255</td>
              <td>254</td>
              <td>162</td>
              <td>Factory</td>
              <td>Fixed</td>
              <td></td>
              <td>FACTORY - NETWORK - MGMT</td>
              <td>{t("ipDivision.notes.nativeVlan")}</td>
            </tr>

            {/* 172.25.163 */}
            <tr>
              <td>172.25.163</td>
              <td>8</td>
              <td>172.25.163.0/24</td>
              <td>/24 - 255.255.255.0</td>
              <td>172.25.163.1</td>
              <td>172.25.163.0 ~ 255</td>
              <td>254</td>
              <td>163</td>
              <td>Office</td>
              <td>Fixed</td>
              <td></td>
              <td>Server Segment</td>
              <td></td>
            </tr>

            {/* 172.25.164 */}
            <tr className="row-peach">
              <td>172.25.164</td>
              <td>9</td>
              <td>172.25.164.0/24</td>
              <td>/24 - 255.255.255.0</td>
              <td>172.25.164.1</td>
              <td>172.25.164.0 ~ 255</td>
              <td>254</td>
              <td>164</td>
              <td>Office</td>
              <td>
                DHCP
                <br />
                Fixed
              </td>
              <td>
                172.25.164.11 ~ 17
                <br />
                172.25.164.171 ~ 250
              </td>
              <td>
                SAS Office1 (BF Office RM, Meeting RM)
                <br />
                <div>
                  BF Entry-Security and Attendance Reader,MeetingSystem,Printer
                </div>
              </td>
              <td>
                {t("ipDivision.notes.vlanPrimary")}
                <br />
                <div className="bullet-point">
                  {t("ipDivision.notes.dhcpFixedRange")}
                </div>
                <div className="bullet-point">
                  {t("ipDivision.notes.canSplit")}
                </div>
              </td>
            </tr>

            {/* 172.25.165 – split into two /25 blocks */}
            <tr className="row-peach">
              <td rowSpan={2}>172.25.165</td>
              <td>10</td>
              <td>172.25.165.0/25</td>
              <td>/25 - 255.255.255.128</td>
              <td>172.25.165.1</td>
              <td>172.25.165.0 ~ 127</td>
              <td>126</td>
              <td>164</td>
              <td>Office</td>
              <td>Fixed</td>
              <td></td>
              <td>SAS Office2 (BF Factory Area)</td>
              <td>
                {t("ipDivision.notes.vlanSecondary")}
                <br />
                <small>{t("ipDivision.notes.disableInternet")}</small>
              </td>
            </tr>
            <tr className="table-secondary">
              <td></td>
              <td colSpan={4}></td>
              <td>172.25.165.128 ~ 255</td>
              <td colSpan={7}></td>
            </tr>

            {/* 172.25.166 /23 */}
            <tr className="row-peach">
              <td rowSpan={2}>
                172.25.166
                <br />
                172.25.167
              </td>
              <td>11</td>
              <td>172.25.166.0/23</td>
              <td>/23 - 255.255.254.0</td>
              <td>172.25.166.1</td>
              <td>172.25.166.0 ~ 167.255</td>
              <td>508</td>
              <td>166</td>
              <td>Office</td>
              <td>
                DHCP
                <br />
                Fixed
              </td>
              <td>
                172.25.166.11 ~ 25
                <br />
                172.25.167.128 ~ 250
              </td>
              <td>
                DP Office (1F Office RM, Meeting RM, some DP factory)
                <br />
                <div>
                  1F Entry-Security and Attendance Reader,MeetingSystem,Printer
                </div>
              </td>
              <td>
                <div className="bullet-point">
                  {t("ipDivision.notes.dhcpFixedRange")}
                </div>
                <div className="bullet-point">
                  {t("ipDivision.notes.canSplit")}
                </div>
              </td>
            </tr>
            <tr className="table-secondary"></tr>

            {/* 172.25.168 /23 */}
            <tr className="row-peach">
              <td rowSpan={2}>
                172.25.168
                <br />
                172.25.169
              </td>
              <td>12</td>
              <td>172.25.168.0/23</td>
              <td>/23 - 255.255.254.0</td>
              <td>172.25.168.1</td>
              <td>172.25.168.0 ~ 169.255</td>
              <td>508</td>
              <td>168</td>
              <td>Office</td>
              <td>
                DHCP
                <br />
                Fixed
              </td>
              <td>
                172.25.168.11 ~ 25
                <br />
                172.25.169.128 ~ 250
              </td>
              <td>
                CM Office (2F Office RM, Meeting RM)
                <br />
                <div>
                  2F Entry-Security and Attendance Reader,MeetingSystem,Printer
                </div>
              </td>
              <td>
                <div className="bullet-point">
                  {t("ipDivision.notes.dhcpFixedRange")}
                </div>
                <div className="bullet-point">
                  {t("ipDivision.notes.canSplit")}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IPDivisionTable;
