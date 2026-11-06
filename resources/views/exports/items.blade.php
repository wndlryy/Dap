<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 160px 40px 140px 40px;
        }
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 11px;
            color: #111;
        }
        header {
            position: fixed;
            top: -140px;
            left: 0;
            right: 0;
            height: 120px;
            text-align: center;
        }
        .header-logo {
            position: absolute;
            top: 0;
            width: 70px;
            height: 70px;
            border: 1px solid #999;
            border-radius: 50%;
            text-align: center;
            line-height: 70px;
            font-size: 9px;
            color: #999;
        }
        .header-logo.left {
            left: 40px;
        }
        .header-logo.right {
            right: 40px;
        }
        header h1 {
            margin: 0;
            font-size: 13px;
            letter-spacing: 0.5px;
        }
        header h2 {
            margin: 2px 0 4px 0;
            font-size: 15px;
        }
        header p {
            margin: 0;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        header p.category {
            font-weight: bold;
            margin-top: 4px;
        }
        footer {
            position: fixed;
            bottom: -120px;
            left: 0;
            right: 0;
            height: 100px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            text-transform: uppercase;
        }
        th, td {
            border: 1px solid #333;
            padding: 5px 6px;
            text-align: left;
        }
        th {
            background: #eee;
        }
        .text-right {
            text-align: right;
        }
        /* Signature block: absolute positioning instead of flexbox
           (unsupported by DomPDF) or a nested table (DomPDF has to
           reflow nested tables on every page inside a fixed-position
           footer, which is slow enough to time out on larger reports). */
        .signature-block {
            position: relative;
            height: 50px;
            margin-top: 20px;
        }
        .signature-line {
            position: absolute;
            top: 0;
            width: 200px;
            text-align: center;
        }
        .signature-line .signee-name {
            display: block;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .signature-line .signature-rule {
            border-top: 1px solid #000;
            height: 0;
            font-size: 0;
            line-height: 0;
        }
        .signature-line .signee-title {
            display: block;
            padding-top: 4px;
        }
        .signature-line.left {
            left: 40px;
        }
        .signature-line.right {
            right: 40px;
        }
        .totals-row td {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <header>
        {{-- <div class="header-logo left">LOGO</div>
        <div class="header-logo right">LOGO</div> --}}

        <h2>DANAO ADVENTURE PARK</h2>
        <p>{{ $reportTitle }}</p>
        <p class="category">{{ $categoryName }}</p>
        <p>{{ $periodStart }} - {{ $periodEnd }}</p>
    </header>
    <footer>
        <div class="signature-block">
            <div class="signature-line left">
                <span class="signee-name">Meloudy M. Oroyan</span>
                <div class="signature-rule">&nbsp;</div>
                <span class="signee-title">DAP STOCK CONTROLLER</span>
            </div>
            <div class="signature-line right">
                <span class="signee-name">Judelyn T. Cajelo</span>
                <div class="signature-rule">&nbsp;</div>
                <span class="signee-title">DAP MANAGER</span>
            </div>
        </div>
    </footer>

    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th class="text-right">Qty</th>
                <th>Unit</th>
                <th>Item Description</th>
                <th class="text-right">Unit Cost</th>
                <th class="text-right">Total Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td class="text-right">{{ $item->ending_stock }}</td>
                    <td>{{ $item->unit }}</td>
                    <td>{{ $item->name }}</td>
                    <td class="text-right">{{ number_format($item->average_cost_as_of_period, 2) }}</td>
                    <td class="text-right">{{ number_format($item->ending_stock * $item->average_cost_as_of_period, 2) }}</td>
                </tr>
            @endforeach
            <tr class="totals-row">
                <td colspan="5" class="text-right">Total Ending Inventory Value</td>
                <td class="text-right">{{ number_format($totalValue, 2) }}</td>
            </tr>
        </tbody>
    </table>
</body>
</html>