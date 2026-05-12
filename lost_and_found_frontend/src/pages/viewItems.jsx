import { useState } from "react";
import "./ViewItems.css";

function ViewItem() {

  const [itemId, setItemId] =
    useState("");

  const [item, setItem] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchItem = async () => {

    try {
      setLoading(true);
      setError("");
      setItem(null);

      if (!itemId) {

        setError(
          "Please enter Item ID"
        );

        return;

      }

      // Fetch blockchain item

      const response =
        await fetch(
          `http://localhost:5001/api/blockchain/get-item/${itemId}`
        );

      const data =
        await response.json();

      if (!data.success) {

        throw new Error(
          data.message
        );

      }

      // Fetch metadata from IPFS

      const metadataRes =
        await fetch(
          data.item.ipfsUrl
        );

      const metadata =
        await metadataRes.json();

      console.log(
        "Metadata:",
        metadata
      );

      // Combine blockchain + metadata

      setItem({

        ...data.item,

        metadata

      });

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="page">

      <div className="item-card">

        <h1>
          Lost & Found NFT Lookup
        </h1>

        <p className="subtitle">
          Enter NFT Item ID
        </p>

        {/* Search Box */}

        <div className="search-box">

          <input
            type="number"
            placeholder="Enter Item ID"
            value={itemId}
            onChange={(e) =>
              setItemId(
                e.target.value
              )
            }
          />

          <button
            onClick={fetchItem}
          >
            Search
          </button>

        </div>

        {/* Loading */}

        {loading && (

          <div className="center">
            Loading...
          </div>

        )}

        {/* Error */}

        {error && (

          <div className="error">
            {error}
          </div>

        )}

        {/* Item Details */}

        {item && (

          <>

            {/* Item Image */}

            <img
              src={
                item.metadata
                  .imageCID?.[0]

                  ? `https://gateway.pinata.cloud/ipfs/${item.metadata.imageCID[0]}`

                  : "https://via.placeholder.com/500"
              }
              alt={
                item.metadata.itemName
              }
              className="item-image"
            />

            {/* Item Name */}

            <h2>
              {
                item.metadata
                  .itemName
              }
            </h2>

            {/* Status */}

            <div className="badge">
              {item.status}
            </div>

            {/* Description */}

            <div className="section">

              <h3>
                Description
              </h3>

              <p>
                {
                  item.metadata
                    .description
                }
              </p>

            </div>

            {/* Item Details */}

            <div className="grid">

              <div>

                <span>
                  Category
                </span>

                <p>
                  {
                    item.metadata
                      .category
                  }
                </p>

              </div>

              <div>

                <span>
                  Brand
                </span>

                <p>
                  {
                    item.metadata
                      .deviceInformation
                      ?.brand
                  }
                </p>

              </div>

              <div>

                <span>
                  Model
                </span>

                <p>
                  {
                    item.metadata
                      .deviceInformation
                      ?.model
                  }
                </p>

              </div>

              <div>

                <span>
                  Color
                </span>

                <p>
                  {
                    item.metadata
                      .physicalDetails
                      ?.color
                  }
                </p>

              </div>

              <div>

                <span>
                  Condition
                </span>

                <p>
                  {
                    item.metadata
                      .physicalDetails
                      ?.condition
                  }
                </p>

              </div>

              <div>

                <span>
                  Custom Markings
                </span>

                <p>
                  {
                    item.metadata
                      .physicalDetails
                      ?.customMarkings
                  }
                </p>

              </div>

              <div>

                <span>
                  Timestamp
                </span>

                <p>
                  {new Date(
                    item.metadata
                      .timestamp
                  ).toLocaleString()}
                </p>

              </div>

            </div>

            {/* Blockchain Details */}

            <div className="section">

              <h3>
                Blockchain Details
              </h3>

              <p>

                <strong>
                  Token ID:
                </strong>

                {" "}
                {item.itemId}

              </p>

              <p>

                <strong>
                  Owner:
                </strong>

                {" "}
                {item.owner}

              </p>

              <p>

                <strong>
                  Finder:
                </strong>

                {" "}
                {item.finder}

              </p>

              <p>

                <strong>
                  IPFS Metadata:
                </strong>

                {" "}

                <a
                  href={
                    item.ipfsUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  View Metadata
                </a>

              </p>

            </div>

          </>

        )}

      </div>

    </div>
  );
}

export default ViewItem;