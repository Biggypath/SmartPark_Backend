-- CreateTable
CREATE TABLE "roads" (
    "road_id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "cx" DOUBLE PRECISION NOT NULL,
    "cy" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL,
    "d" DOUBLE PRECISION NOT NULL,
    "horizontal" BOOLEAN NOT NULL,

    CONSTRAINT "roads_pkey" PRIMARY KEY ("road_id")
);

-- AddForeignKey
ALTER TABLE "roads" ADD CONSTRAINT "roads_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "parking_lots"("lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;
